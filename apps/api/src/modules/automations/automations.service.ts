// ============================================================================
// automations.service.ts — Dos automatizaciones, ambas apagadas por
// defecto y prendidas por tenant (ver TenantFeature, schema.prisma —
// reusa esa tabla generica de feature flags en vez de agregar columnas
// nuevas a Tenant):
//
//   1) "auto_issue_certificate" — cuando una matricula pasa a "completed"
//      (ver enrollment.service.ts, updateStatus), se intenta emitir su
//      certificado automaticamente en vez de exigir un segundo paso manual
//      (ver certificate.service.ts, "issue" — la logica de emision en si
//      NO CAMBIA, esto solo la DISPARA sola).
//
//   2) "due_date_reminders" — recordatorio de FIN DE PERIODO ACADEMICO
//      (Term.endDate, schema.prisma) por correo, a cada alumno con una
//      matricula activa en un curso de ese periodo. Se eligio "fin de
//      periodo" y NO "vencimiento de evaluacion" porque Assessment no
//      tiene ningun campo de fecha limite real en el modelo de datos hoy
//      (se comprobo revisando schema.prisma: solo hay un comentario
//      aspiracional sobre una "ventana de tiempo" en el JSON de config,
//      nunca implementada) — Term.endDate, en cambio, es un campo real y
//      poblado para todo periodo. Correr como job diario (ver
//      "@Cron" mas abajo), leyendo ReminderLog para nunca mandar el mismo
//      aviso dos veces a la misma persona.
//
// "AUTOMATIZACIONES AVANZADAS" (plan Pro) — dos mas, ambas reusando
// "getAtRiskStudentsForTenant" de ReportsService (misma heuristica que ve
// el reporte "Alumnos en riesgo", ver reports.service.ts) en vez de
// reimplementarla aca:
//
//   3) "inactivity_alerts" — cuando un alumno con matricula activa lleva
//      10+ dias sin actividad, se avisa por correo a quien lo puede hacer
//      algo al respecto: el/los Docente(s) de ESE curso (via UserRole
//      acotado con "scopeCourseId") o, si nadie tiene ese rol acotado
//      todavia, al Coordinador académico del tenant entero. Una sola vez
//      por matricula+destinatario (ver ReminderLog), no todos los dias.
//
//   4) "at_risk_weekly_digest" — un resumen semanal (lunes 8am) de TODOS
//      los alumnos en riesgo del tenant, a cada Coordinador académico —
//      pensado para quien NO quiere revisar el reporte a mano cada
//      semana. A diferencia de (3), no se deduplica con ReminderLog: es
//      un digest que se regenera entero cada semana, no un aviso puntual.
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService, PrismaTransactionClient } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { MailService } from '../../common/mail/mail.service';
import { ReportsService, AtRiskStudentRow } from '../reports/reports.service';
import { UpdateAutomationSettingsDto } from './dto/update-automation-settings.dto';

const AUTO_ISSUE_CERTIFICATE_KEY = 'auto_issue_certificate';
const DUE_DATE_REMINDERS_KEY = 'due_date_reminders';
const INACTIVITY_ALERTS_KEY = 'inactivity_alerts';
const AT_RISK_WEEKLY_DIGEST_KEY = 'at_risk_weekly_digest';
const REMINDER_WINDOW_DAYS = 3;
const INACTIVITY_ALERT_DAYS = 10;
const AT_RISK_REPORT_DAYS = 14;
const ALL_FEATURE_KEYS = [
  AUTO_ISSUE_CERTIFICATE_KEY,
  DUE_DATE_REMINDERS_KEY,
  INACTIVITY_ALERTS_KEY,
  AT_RISK_WEEKLY_DIGEST_KEY,
];

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly mail: MailService,
    private readonly reportsService: ReportsService,
  ) {}

  async getSettings() {
    const tenantId = this.tenantContext.requireTenantId();
    return this.readSettings(tenantId);
  }

  private async readSettings(tenantId: string) {
    const features = await this.prisma.withTenant(tenantId, (tx) =>
      tx.tenantFeature.findMany({ where: { featureKey: { in: ALL_FEATURE_KEYS } } }),
    );
    const byKey = new Map(features.map((f) => [f.featureKey, f.enabled]));
    return {
      autoIssueCertificate: byKey.get(AUTO_ISSUE_CERTIFICATE_KEY) ?? false,
      dueDateReminders: byKey.get(DUE_DATE_REMINDERS_KEY) ?? false,
      inactivityAlerts: byKey.get(INACTIVITY_ALERTS_KEY) ?? false,
      atRiskWeeklyDigest: byKey.get(AT_RISK_WEEKLY_DIGEST_KEY) ?? false,
    };
  }

  async updateSettings(dto: UpdateAutomationSettingsDto) {
    const tenantId = this.tenantContext.requireTenantId();

    const toUpsert: Array<[string, boolean | undefined]> = [
      [AUTO_ISSUE_CERTIFICATE_KEY, dto.autoIssueCertificate],
      [DUE_DATE_REMINDERS_KEY, dto.dueDateReminders],
      [INACTIVITY_ALERTS_KEY, dto.inactivityAlerts],
      [AT_RISK_WEEKLY_DIGEST_KEY, dto.atRiskWeeklyDigest],
    ];

    await this.prisma.withTenant(tenantId, async (tx) => {
      for (const [featureKey, enabled] of toUpsert) {
        if (enabled === undefined) continue;
        await tx.tenantFeature.upsert({
          where: { tenantId_featureKey: { tenantId, featureKey } },
          create: { tenantId, featureKey, enabled },
          update: { enabled },
        });
      }
    });

    return this.readSettings(tenantId);
  }

  // Usado por enrollment.service.ts (updateStatus) para decidir si intenta
  // la emision automatica — "tenantId" explicito (no
  // "tenantContext.requireTenantId()") porque quien llama YA esta parado
  // dentro de su propia transaccion "withTenant" y ya conoce ese id; pedirlo
  // de nuevo del contexto seria redundante.
  async isFeatureEnabled(tenantId: string, featureKey: string): Promise<boolean> {
    const feature = await this.prisma.withTenant(tenantId, (tx) =>
      tx.tenantFeature.findUnique({ where: { tenantId_featureKey: { tenantId, featureKey } } }),
    );
    return feature?.enabled ?? false;
  }

  // Job diario: recordatorio de fin de periodo. "@Cron" (nestjs/schedule)
  // corre DENTRO del mismo proceso del backend — no hace falta Redis/una
  // cola aparte para este volumen (un tenant, unos pocos periodos por
  // vez); si el dia de mañana esto crece mucho, es el momento de mover
  // esto a un worker con BullMQ (Redis ya esta provisionado, ver
  // docker-compose.yml, pero sin uso asignado todavia).
  @Cron('0 8 * * *')
  async sendTermEndingReminders(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({ where: { active: true }, select: { id: true } });
    for (const { id: tenantId } of tenants) {
      try {
        await this.sendTermEndingRemindersForTenant(tenantId);
      } catch (err) {
        // Un tenant con un error no debe frenar el aviso al resto — se
        // registra y se sigue con el proximo.
        this.logger.error(
          `Fallo el recordatorio de fin de periodo para el tenant ${tenantId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  private async sendTermEndingRemindersForTenant(tenantId: string): Promise<void> {
    const enabled = await this.isFeatureEnabled(tenantId, DUE_DATE_REMINDERS_KEY);
    if (!enabled) return;

    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.withTenant(tenantId, async (tx) => {
      const endingTerms = await tx.term.findMany({
        where: { endDate: { gte: now, lte: windowEnd } },
      });

      for (const term of endingTerms) {
        const enrollments = await tx.enrollment.findMany({
          where: { status: 'active', section: { course: { termId: term.id } } },
          include: { userTenant: { include: { user: true } }, section: { include: { course: true } } },
        });

        for (const enrollment of enrollments) {
          const alreadySent = await tx.reminderLog.findUnique({
            where: {
              type_referenceId_userTenantId: {
                type: 'term_ending',
                referenceId: term.id,
                userTenantId: enrollment.userTenantId,
              },
            },
          });
          if (alreadySent) continue;

          const { sent } = await this.mail.send(
            enrollment.userTenant.user.email,
            `Tu periodo académico "${term.name}" está por terminar`,
            `<p>Hola ${enrollment.userTenant.user.fullName},</p>
             <p>Tu periodo académico <strong>${term.name}</strong> termina el
             ${term.endDate.toLocaleDateString('es-PE')}. Si tienes evaluaciones
             pendientes en <strong>${enrollment.section.course.title}</strong>,
             te recomendamos completarlas antes de esa fecha.</p>
             <p>— Stoka LMS</p>`,
          );

          if (!sent) {
            // NO se registra en ReminderLog si en verdad no se envio (ej.
            // SMTP todavia sin configurar, ver mail.service.ts): dejarlo
            // sin registrar permite que el proximo dia (mientras siga
            // dentro de la ventana de aviso) se vuelva a intentar en vez
            // de darlo por "ya avisado" para siempre sin haber avisado a
            // nadie de verdad.
            this.logger.debug(`Recordatorio NO enviado (correo desactivado) a ${enrollment.userTenant.user.email}.`);
            continue;
          }

          await tx.reminderLog.create({
            data: { tenantId, type: 'term_ending', referenceId: term.id, userTenantId: enrollment.userTenantId },
          });
        }
      }
    });
  }

  // --- Alertas de inactividad (plan Pro) -----------------------------------

  @Cron('0 9 * * *')
  async sendInactivityAlerts(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({ where: { active: true }, select: { id: true } });
    for (const { id: tenantId } of tenants) {
      try {
        await this.sendInactivityAlertsForTenant(tenantId);
      } catch (err) {
        this.logger.error(
          `Fallo la alerta de inactividad para el tenant ${tenantId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  private async sendInactivityAlertsForTenant(tenantId: string): Promise<void> {
    const enabled = await this.isFeatureEnabled(tenantId, INACTIVITY_ALERTS_KEY);
    if (!enabled) return;

    const atRiskRows = await this.reportsService.getAtRiskStudentsForTenant(tenantId, undefined, INACTIVITY_ALERT_DAYS);
    if (atRiskRows.length === 0) return;

    await this.prisma.withTenant(tenantId, async (tx) => {
      for (const row of atRiskRows) {
        const recipients = await this.findStaffToNotify(tx, row.courseId);
        for (const recipient of recipients) {
          const alreadySent = await tx.reminderLog.findUnique({
            where: {
              type_referenceId_userTenantId: {
                type: 'inactivity_alert',
                referenceId: row.enrollmentId,
                userTenantId: recipient.userTenantId,
              },
            },
          });
          if (alreadySent) continue;

          const { sent } = await this.mail.send(
            recipient.email,
            `${row.studentName} lleva ${row.daysInactive} días sin actividad en "${row.courseTitle}"`,
            `<p>Hola ${recipient.fullName},</p>
             <p><strong>${row.studentName}</strong> (${row.studentEmail}) tiene una matrícula activa en
             <strong>${row.courseTitle}</strong> (sección ${row.sectionName}) pero no registra actividad
             (ni vio una lección, ni entregó nada) desde hace <strong>${row.daysInactive} días</strong>.</p>
             <p>— Stoka LMS</p>`,
          );
          if (!sent) continue;

          await tx.reminderLog.create({
            data: {
              tenantId,
              type: 'inactivity_alert',
              referenceId: row.enrollmentId,
              userTenantId: recipient.userTenantId,
            },
          });
        }
      }
    });
  }

  // A quien avisar de una matricula en riesgo de UN curso: primero se
  // busca Docente(s) acotados a ESE curso especifico; si nadie tiene ese
  // rol acotado todavia, se cae al Coordinador académico del tenant
  // entero (mejor avisarle a quien SI puede hacer algo, aunque no sea el
  // destinatario mas especifico, que no avisar a nadie).
  private async findStaffToNotify(
    tx: PrismaTransactionClient,
    courseId: string,
  ): Promise<Array<{ userTenantId: string; email: string; fullName: string }>> {
    const toRecipients = (roles: Array<{ userTenantId: string; userTenant: { user: { email: string; fullName: string } } }>) =>
      roles.map((r) => ({
        userTenantId: r.userTenantId,
        email: r.userTenant.user.email,
        fullName: r.userTenant.user.fullName,
      }));

    const teachers = await tx.userRole.findMany({
      where: { role: { name: 'Docente' }, scopeCourseId: courseId },
      include: { userTenant: { include: { user: true } } },
    });
    if (teachers.length > 0) return toRecipients(teachers);

    const coordinators = await tx.userRole.findMany({
      where: { role: { name: 'Coordinador académico' } },
      include: { userTenant: { include: { user: true } } },
    });
    return toRecipients(coordinators);
  }

  // --- Resumen semanal de alumnos en riesgo (plan Pro) ---------------------

  @Cron('0 8 * * 1') // Lunes 8am.
  async sendAtRiskWeeklyDigest(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({ where: { active: true }, select: { id: true } });
    for (const { id: tenantId } of tenants) {
      try {
        await this.sendAtRiskWeeklyDigestForTenant(tenantId);
      } catch (err) {
        this.logger.error(
          `Fallo el resumen semanal de alumnos en riesgo para el tenant ${tenantId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  private async sendAtRiskWeeklyDigestForTenant(tenantId: string): Promise<void> {
    const enabled = await this.isFeatureEnabled(tenantId, AT_RISK_WEEKLY_DIGEST_KEY);
    if (!enabled) return;

    const atRiskRows = await this.reportsService.getAtRiskStudentsForTenant(tenantId, undefined, AT_RISK_REPORT_DAYS);
    if (atRiskRows.length === 0) return;

    const coordinators = await this.prisma.withTenant(tenantId, (tx) =>
      tx.userRole.findMany({
        where: { role: { name: 'Coordinador académico' } },
        include: { userTenant: { include: { user: true } } },
      }),
    );
    if (coordinators.length === 0) return;

    const listHtml = atRiskRows
      .map(
        (row: AtRiskStudentRow) =>
          `<li>${row.studentName} (${row.studentEmail}) — ${row.courseTitle}, ${row.daysInactive} días sin actividad</li>`,
      )
      .join('');

    const seenRecipients = new Set<string>();
    for (const c of coordinators) {
      const email = c.userTenant.user.email;
      if (seenRecipients.has(email)) continue;
      seenRecipients.add(email);

      await this.mail.send(
        email,
        `Resumen semanal: ${atRiskRows.length} alumno(s) en riesgo`,
        `<p>Hola ${c.userTenant.user.fullName},</p>
         <p>Esta semana hay <strong>${atRiskRows.length}</strong> alumno(s) con matrícula activa sin
         actividad reciente:</p>
         <ul>${listHtml}</ul>
         <p>— Stoka LMS</p>`,
      );
    }
  }
}
