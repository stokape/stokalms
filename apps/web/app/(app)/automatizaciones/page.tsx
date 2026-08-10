// ============================================================================
// automatizaciones/page.tsx — Dos interruptores, ambos apagados por
// defecto (ver apps/api/src/modules/automations/). Requiere "tenant:edit"
// (Super Admin / Administrador de entidad) — mismo criterio que
// mantenimiento/dominios/marca.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getLocale } from '@/lib/locale';
import { guardarAutomatizaciones } from './actions';

const TEXT = {
  es: {
    title: 'Automatizaciones',
    description: 'Tareas que Stoka LMS puede hacer sola, sin que alguien tenga que acordarse de hacerlas a mano.',
    done: 'Listo.',
    certTitle: 'Emisión automática de certificado',
    certHelp:
      'Cuando una matrícula pasa a "Completada", se intenta emitir su certificado en el momento — usa la misma plantilla que ya tiene asignada el curso. Si el curso todavía no tiene plantilla, no pasa nada (se puede seguir emitiendo a mano).',
    reminderTitle: 'Recordatorio de fin de periodo',
    reminderHelp:
      'Unos días antes de que termine un periodo académico, se envía un correo a cada alumno con matrícula activa en un curso de ese periodo, recordándole completar sus evaluaciones pendientes.',
    reminderNote:
      'El envío de correo depende de que el equipo técnico haya configurado un servidor SMTP — si todavía no está configurado, el recordatorio queda "listo" pero no se manda ningún correo real.',
    inactivityTitle: 'Alerta de inactividad',
    inactivityHelp:
      'Cuando un alumno con matrícula activa lleva 10 días sin actividad (sin ver una lección ni entregar nada), se avisa por correo al Docente de ese curso (o al Coordinador académico, si nadie tiene ese rol asignado todavía). Una sola vez por matrícula, no todos los días.',
    digestTitle: 'Resumen semanal de alumnos en riesgo',
    digestHelp:
      'Cada lunes, un correo a cada Coordinador académico con la lista completa de alumnos en riesgo (14+ días sin actividad) — mismo criterio que usa el reporte "Analítica avanzada" en Reportes.',
    save: 'Guardar',
  },
  en: {
    title: 'Automations',
    description: 'Tasks Stoka LMS can do on its own, without anyone having to remember to do them by hand.',
    done: 'Done.',
    certTitle: 'Automatic certificate issuance',
    certHelp:
      'When an enrollment moves to "Completed", its certificate is issued right away — using the template already assigned to the course. If the course has no template yet, nothing happens (it can still be issued manually).',
    reminderTitle: 'End-of-term reminder',
    reminderHelp:
      'A few days before an academic term ends, an email is sent to every student with an active enrollment in a course of that term, reminding them to complete pending assessments.',
    reminderNote:
      "Sending email depends on the technical team having configured an SMTP server — if it isn't configured yet, the reminder is 'ready' but no real email is sent.",
    inactivityTitle: 'Inactivity alert',
    inactivityHelp:
      "When a student with an active enrollment goes 10 days without activity (no lesson viewed, nothing submitted), the course's Teacher is emailed (or the Academic Coordinator, if no one has that role assigned yet). Once per enrollment, not every day.",
    digestTitle: 'Weekly at-risk students digest',
    digestHelp:
      'Every Monday, each Academic Coordinator gets an email with the full list of at-risk students (14+ days without activity) — same criteria as the "Advanced analytics" report under Reports.',
    save: 'Save',
  },
};

interface AutomationSettings {
  autoIssueCertificate: boolean;
  dueDateReminders: boolean;
  inactivityAlerts: boolean;
  atRiskWeeklyDigest: boolean;
}

export default async function AutomatizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let settings: AutomationSettings;
  try {
    settings = await apiFetch<AutomationSettings>(token, '/automations/settings');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t.title} description={t.description} />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {saved && <Card className="mb-6 border-success/30 bg-success-bg text-sm text-success">{t.done}</Card>}

      <Card>
        <form action={guardarAutomatizaciones} className="flex flex-col gap-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="autoIssueCertificate"
              defaultChecked={settings.autoIssueCertificate}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm">
              <span className="font-medium">{t.certTitle}</span>
              <span className="block text-xs text-muted">{t.certHelp}</span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="dueDateReminders"
              defaultChecked={settings.dueDateReminders}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm">
              <span className="font-medium">{t.reminderTitle}</span>
              <span className="block text-xs text-muted">{t.reminderHelp}</span>
              <span className="mt-1 block text-xs text-warning">{t.reminderNote}</span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="inactivityAlerts"
              defaultChecked={settings.inactivityAlerts}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm">
              <span className="font-medium">{t.inactivityTitle}</span>
              <span className="block text-xs text-muted">{t.inactivityHelp}</span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="atRiskWeeklyDigest"
              defaultChecked={settings.atRiskWeeklyDigest}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm">
              <span className="font-medium">{t.digestTitle}</span>
              <span className="block text-xs text-muted">{t.digestHelp}</span>
            </span>
          </label>

          <div className="flex justify-end">
            <Button type="submit">{t.save}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
