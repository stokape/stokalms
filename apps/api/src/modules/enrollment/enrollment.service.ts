// ============================================================================
// enrollment.service.ts — Logica de negocio de la matricula individual (ver
// docs/architecture/04-flujos-criticos.md, seccion 4.1).
// ============================================================================

import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthenticatedUser } from '../../auth/auth.service';
import { CertificateService } from '../certificates/certificate.service';
import { AutomationsService } from '../automations/automations.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { BulkEnrollDto } from './dto/bulk-enroll.dto';
import { ImportHistoricalEnrollmentsDto } from './dto/import-historical-enrollments.dto';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly certificateService: CertificateService,
    private readonly automationsService: AutomationsService,
    private readonly auditService: AuditService,
  ) {}

  async create(courseId: string, sectionId: string, dto: CreateEnrollmentDto) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const section = await tx.section.findUnique({ where: { id: sectionId } });
      if (!section || section.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la seccion "${sectionId}" en el curso "${courseId}".`,
        );
      }

      // Buscar-o-crear la persona por email: el mismo patron de
      // aprovisionamiento que usa el login (ver auth.service.ts,
      // "findOrProvisionUser"), pero disparado aqui por un coordinador en
      // vez de por un inicio de sesion real — el estudiante puede
      // matricularse ANTES de haber iniciado sesion alguna vez.
      const user = await tx.user.upsert({
        where: { email: dto.email },
        update: {},
        create: { email: dto.email, fullName: dto.fullName ?? dto.email },
      });

      const userTenant = await tx.userTenant.upsert({
        where: { userId_tenantId: { userId: user.id, tenantId } },
        update: {},
        create: { userId: user.id, tenantId, status: 'active' },
      });

      const existing = await tx.enrollment.findUnique({
        where: { sectionId_userTenantId: { sectionId, userTenantId: userTenant.id } },
      });

      if (existing?.status === 'active') {
        throw new ConflictException(
          `${dto.email} ya esta matriculado activamente en esta seccion.`,
        );
      }

      // Cupo maximo: "capacity = 0" se interpreta como "sin limite" (ver
      // CreateSectionDto, valor por defecto). Solo se cuenta contra
      // estudiantes ACTIVOS: alguien que se retiro no deberia seguir
      // "ocupando" un cupo. Este chequeo aplica TANTO a una matricula
      // nueva COMO a reactivar una previamente retirada (existing.status
      // === "dropped") — antes de esta correccion, reactivar se saltaba el
      // limite de cupo por completo, detectado probando de verdad: una
      // seccion con capacidad 1 termino con 2 matriculas activas.
      if (section.capacity > 0) {
        const activeCount = await tx.enrollment.count({
          where: { sectionId, status: 'active' },
        });
        if (activeCount >= section.capacity) {
          throw new ConflictException('La seccion alcanzo su capacidad maxima.');
        }
      }

      // Si la persona ya estuvo matriculada antes en esta seccion y fue
      // "dropped" (retirada), un nuevo intento de matricularla la
      // REACTIVA en vez de crear una fila duplicada — preserva el
      // historial (ver el comentario en update-enrollment-status.dto.ts)
      // en lugar de acumular registros redundantes.
      if (existing) {
        return tx.enrollment.update({
          where: { id: existing.id },
          data: { status: 'active' },
        });
      }

      return tx.enrollment.create({
        data: { tenantId, sectionId, userTenantId: userTenant.id, status: 'active' },
      });
    });
  }

  // Matricula MASIVA: una fila por estudiante, tipicamente desde un CSV que
  // la institucion sube (ver el permiso "enrollment:bulk_import", ya
  // sembrado en prisma/seed.js). Cada fila corre en SU PROPIA llamada a
  // "create()" (su propia transaccion), no todas dentro de una unica
  // transaccion — si una fila falla (email invalido, cupo lleno, ya
  // matriculado), NO debe arrastrar a las demas filas ya procesadas
  // correctamente: quien sube un CSV de 50 estudiantes necesita saber
  // CUALES 49 entraron bien y CUAL 1 fallo, no un rollback total por un
  // solo error tipográfico.
  async bulkCreate(courseId: string, sectionId: string, dto: BulkEnrollDto) {
    const results: Array<{ email: string; status: 'matriculado' | 'error'; message?: string }> = [];
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const row of dto.rows) {
      // El formato se valida ACA (no con "@IsEmail()" en el DTO, ver la
      // nota extensa en bulk-enroll.dto.ts) para que una fila con un email
      // mal escrito quede como un error MAS en la lista de resultados, sin
      // tumbar las filas validas que la acompañan en el mismo archivo.
      if (!EMAIL_PATTERN.test(row.email)) {
        results.push({ email: row.email, status: 'error', message: 'El email no tiene un formato válido.' });
        continue;
      }

      try {
        await this.create(courseId, sectionId, { email: row.email, fullName: row.fullName });
        results.push({ email: row.email, status: 'matriculado' });
      } catch (err) {
        results.push({
          email: row.email,
          status: 'error',
          message: err instanceof Error ? err.message : 'Error inesperado.',
        });
      }
    }

    return { results };
  }

  async findAllBySection(courseId: string, sectionId: string) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const section = await tx.section.findUnique({ where: { id: sectionId } });
      if (!section || section.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la seccion "${sectionId}" en el curso "${courseId}".`,
        );
      }

      const enrollments = await tx.enrollment.findMany({
        where: { sectionId },
        include: {
          userTenant: { include: { user: true } },
          // Se incluye ACA (no en un endpoint aparte) para que la pantalla
          // de matriculados pueda mostrar de un vistazo quien ya obtuvo su
          // certificado, sin un pedido extra por alumno (ver la nota en
          // secciones/[sectionId]/page.tsx, frontend).
          certificates: { select: { revoked: true } },
        },
        orderBy: { enrolledAt: 'asc' },
      });

      // Se "aplana" la respuesta (email/nombre directo, sin anidar
      // userTenant.user) porque a quien consume este endpoint (una
      // pantalla de lista de matriculados) no le importa la estructura
      // interna de nuestras tablas — solo quien es cada estudiante y su
      // estado.
      return enrollments.map((e) => ({
        id: e.id,
        status: e.status,
        enrolledAt: e.enrolledAt,
        student: {
          userId: e.userTenant.user.id,
          userTenantId: e.userTenant.id,
          email: e.userTenant.user.email,
          fullName: e.userTenant.user.fullName,
        },
        // "true" si tiene AL MENOS un certificado vigente (no revocado) —
        // alguien puede tener uno revocado y otro vigente emitido despues,
        // asi que "algun revocado" no deberia contar como "no lo tiene".
        hasCertificate: e.certificates.some((c) => !c.revoked),
      }));
    });
  }

  // "Mis matriculas": el punto de entrada de autoservicio para un
  // Estudiante (o cualquier persona), que NO tiene "enrollment:view" (ese
  // permiso es de Coordinador/Docente para ADMINISTRAR matriculas de
  // otros) — ver un servicio (curso + seccion) donde YO estoy matriculado
  // no deberia depender de un permiso administrativo, es simplemente MI
  // propio dato. Por eso este metodo no pasa por PermissionsGuard (ver
  // my-enrollments.controller.ts): esta acotado por construccion a
  // "userTenantId = el de quien pregunta", nunca a otra persona.
  async findMine(user: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollments = await tx.enrollment.findMany({
        where: { userTenantId: user.userTenantId },
        include: { section: { include: { course: true } } },
        orderBy: { enrolledAt: 'desc' },
      });

      return enrollments.map((e) => ({
        id: e.id,
        status: e.status,
        enrolledAt: e.enrolledAt,
        course: { id: e.section.course.id, code: e.section.course.code, title: e.section.course.title },
        section: { id: e.section.id, name: e.section.name },
      }));
    });
  }

  async updateStatus(
    courseId: string,
    sectionId: string,
    id: string,
    dto: UpdateEnrollmentStatusDto,
    actorUserId?: string,
  ) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollment = await tx.enrollment.findUnique({ where: { id } });
      // Se verifica sectionId Y, a traves de la seccion, courseId — mismo
      // motivo que en section.service.ts: que el permiso otorgado para
      // ESTE curso/seccion en la URL no se use para tocar una matricula de
      // otra seccion con un id adivinado.
      if (!enrollment || enrollment.sectionId !== sectionId) {
        throw new NotFoundException(`No existe la matricula "${id}" en esta seccion.`);
      }
      const section = await tx.section.findUnique({ where: { id: sectionId } });
      if (!section || section.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la seccion "${sectionId}" en el curso "${courseId}".`,
        );
      }

      const previousStatus = enrollment.status;
      const wasAlreadyCompleted = enrollment.status === 'completed';
      const updated = await tx.enrollment.update({ where: { id }, data: { status: dto.status } });
      return { updated, previousStatus, justCompleted: !wasAlreadyCompleted && dto.status === 'completed' };
    }).then(async ({ updated, previousStatus, justCompleted }) => {
      await this.auditService.record(tenantId, {
        userId: actorUserId,
        action: 'enrollment.status_changed',
        payload: { enrollmentId: updated.id, from: previousStatus, to: updated.status },
      });

      // FUERA de la transaccion de arriba (que ya hizo commit): emitir un
      // certificado dispara SU PROPIA transaccion (ver certificate.service.ts,
      // "issue"), y una automatizacion que no pudo emitir (ej. el curso
      // todavia no tiene plantilla asignada) NUNCA debe revertir ni
      // bloquear el cambio de estado que la disparo — ver la nota extensa
      // en automations.service.ts sobre "no romper la operacion principal".
      if (justCompleted && (await this.automationsService.isFeatureEnabled(tenantId, 'auto_issue_certificate'))) {
        try {
          await this.certificateService.issue(updated.id, {});
        } catch (err) {
          this.logger.warn(
            `Emision automatica de certificado no realizada para la matricula ${updated.id}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }
      return updated;
    });
  }

  // "Migracion de informacion" (plan Enterprise, ver lib/pricing.ts):
  // carga masiva de matriculas HISTORICAS (con status/fecha ya definidos,
  // no las que se crean "hoy" via create()/bulkCreate() de arriba) para que
  // una institucion pueda traer su historial de otro sistema sin perderlo.
  // A PROPOSITO no toca notas/entregas: fabricar Submissions falsas contra
  // Assessments que la persona nunca rindio de verdad corromperia el
  // gradebook (ver gradebook.service.ts) — si la institucion necesita
  // preservar una nota final historica, hoy no hay forma de importarla sin
  // inventar evidencia que no existe; queda fuera de alcance a proposito.
  async importHistorical(courseId: string, sectionId: string, dto: ImportHistoricalEnrollmentsDto, actorUserId?: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const VALID_STATUSES = new Set(['active', 'completed', 'dropped']);
    const results: Array<{ email: string; status: 'importado' | 'error'; message?: string }> = [];

    await this.prisma.withTenant(tenantId, async (tx) => {
      const section = await tx.section.findUnique({ where: { id: sectionId } });
      if (!section || section.courseId !== courseId) {
        throw new NotFoundException(`No existe la seccion "${sectionId}" en el curso "${courseId}".`);
      }

      for (const row of dto.rows) {
        if (!EMAIL_PATTERN.test(row.email)) {
          results.push({ email: row.email, status: 'error', message: 'El email no tiene un formato válido.' });
          continue;
        }

        // "status"/"enrolledAt" se validan ACA, fila por fila (no con un
        // decorador en el DTO, ver la nota extensa alli) — un valor
        // invalido en UNA fila se reporta como error de ESA fila, sin
        // tumbar el resto del archivo.
        const status = row.status || 'active';
        if (!VALID_STATUSES.has(status)) {
          results.push({
            email: row.email,
            status: 'error',
            message: `El estado "${status}" no es válido — usa "active", "completed" o "dropped".`,
          });
          continue;
        }
        let enrolledAtDate: Date | undefined;
        if (row.enrolledAt) {
          enrolledAtDate = new Date(row.enrolledAt);
          if (Number.isNaN(enrolledAtDate.getTime())) {
            results.push({
              email: row.email,
              status: 'error',
              message: `La fecha "${row.enrolledAt}" no es válida.`,
            });
            continue;
          }
        }

        try {
          const user = await tx.user.upsert({
            where: { email: row.email },
            update: {},
            create: { email: row.email, fullName: row.fullName ?? row.email },
          });
          const userTenant = await tx.userTenant.upsert({
            where: { userId_tenantId: { userId: user.id, tenantId } },
            update: {},
            create: { userId: user.id, tenantId, status: 'active' },
          });

          const existing = await tx.enrollment.findUnique({
            where: { sectionId_userTenantId: { sectionId, userTenantId: userTenant.id } },
          });
          if (existing) {
            results.push({
              email: row.email,
              status: 'error',
              message: 'Ya existe una matricula de esta persona en esta seccion — la importacion no la sobrescribe.',
            });
            continue;
          }

          await tx.enrollment.create({
            data: {
              tenantId,
              sectionId,
              userTenantId: userTenant.id,
              status,
              enrolledAt: enrolledAtDate,
            },
          });
          results.push({ email: row.email, status: 'importado' });
        } catch (err) {
          results.push({
            email: row.email,
            status: 'error',
            message: err instanceof Error ? err.message : 'Error inesperado.',
          });
        }
      }
    });

    await this.auditService.record(tenantId, {
      userId: actorUserId,
      action: 'enrollment.historical_import',
      payload: {
        sectionId,
        total: dto.rows.length,
        importados: results.filter((r) => r.status === 'importado').length,
        errores: results.filter((r) => r.status === 'error').length,
      },
    });

    return { results };
  }
}
