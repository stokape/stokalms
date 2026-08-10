// ============================================================================
// cursos/[courseId]/secciones/[sectionId]/page.tsx — Administracion de UNA
// seccion: quien esta matriculado, su estado, certificado y anotaciones, y
// el acceso a tomar asistencia. Compartida por Coordinador académico
// (matricula/retira, "enrollment:create"/"delete") y Docente (solo mira el
// roster, asistencia, certificados y anotaciones — tiene "enrollment:view"
// pero NO "create"/"delete", ver prisma/seed.js): los formularios de
// matricular/retirar se ocultan segun el permiso real de cada rol, no solo
// segun quien abre la pantalla. Un Estudiante que la abra va a ver el
// ErrorBanner de "no tienes permiso" (ni siquiera tiene "enrollment:view"),
// que es la respuesta correcta: su punto de entrada es "Mis matriculas".
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getCoursePermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { fieldClasses, fileInputClasses } from '@/components/ui/field-styles';
import { getLocale, type Locale } from '@/lib/locale';
import {
  matricular,
  matricularCSV,
  importarMatriculaHistoricaCSV,
  cambiarEstadoMatricula,
  retirarConSustento,
} from './actions';

interface Section {
  id: string;
  name: string;
}

interface EnrollmentRow {
  id: string;
  status: 'active' | 'dropped' | 'completed';
  student: { userId: string; userTenantId: string; email: string; fullName: string };
  hasCertificate: boolean;
}

const ESTADO_LABEL_BY_LOCALE: Record<Locale, Record<string, string>> = {
  es: { active: 'Activo', dropped: 'Retirado', completed: 'Completado' },
  en: { active: 'Active', dropped: 'Dropped', completed: 'Completed' },
};

const ESTADO_TONE: Record<string, 'success' | 'danger' | 'info'> = {
  active: 'success',
  dropped: 'danger',
  completed: 'info',
};

const TEXT = {
  es: {
    course: '← Curso',
    sectionTitle: (name: string) => `Sección: ${name}`,
    takeAttendance: 'Tomar asistencia',
    row: 'fila',
    rows: 'filas',
    bulkOk: (count: number, errorNote: string) => `Se matricularon ${count} estudiantes desde el archivo${errorNote}.`,
    withErrors: (count: number, word: string) => ` (${count} ${word} con error)`,
    enrolledStudents: 'Estudiantes matriculados',
    noEnrollments: 'Todavía nadie está matriculado en esta sección.',
    student: 'Estudiante',
    status: 'Estado',
    certificate: 'Certificado',
    progress: 'Avance',
    notes: 'Anotaciones',
    profile: 'Perfil',
    actions: 'Acciones',
    active: 'Vigente',
    notIssued: 'Sin emitir',
    view: 'Ver',
    edit: 'Editar',
    viewSupport: 'Ver sustentos',
    markCompleted: 'Marcar completado',
    supportTitle: 'Sustento (opcional): carta de retiro, justificativo, etc.',
    withdraw: 'Retirar',
    enrollStudent: 'Matricular estudiante',
    enrollHelp: 'Si el email todavía no tiene cuenta en la plataforma, se crea automáticamente (con el nombre que pongas abajo); cuando esa persona inicie sesión por primera vez, va a encontrar esta matrícula ya lista.',
    emailPlaceholder: 'Email del estudiante',
    fullNamePlaceholder: 'Nombre completo (solo si es una persona nueva)',
    enroll: 'Matricular',
    bulkEnroll: 'Matricular varios a la vez (CSV)',
    bulkHelp: (code: string) => `Un archivo con dos columnas separadas por coma: ${code}, una fila por estudiante. Si alguna fila falla, el resto se matricula igual — al final se muestra qué filas fallaron y por qué.`,
    uploadCsv: 'Subir CSV',
    importTitle: 'Importar matrícula histórica (CSV)',
    importHelp: 'Para traer un roster de otro sistema, con su propio estado y fecha — no matricula "hoy", registra lo que ya pasó. Columnas: email, nombre completo (opcional), estado (active/completed/dropped), fecha de matrícula AAAA-MM-DD (opcional).',
    importOk: (count: number, errorNote: string) => `Se importaron ${count} matrículas históricas${errorNote}.`,
    withErrorsImport: (count: number, word: string) => ` (${count} ${word} con error)`,
    importSubmit: 'Importar',
  },
  en: {
    course: '← Course',
    sectionTitle: (name: string) => `Section: ${name}`,
    takeAttendance: 'Take attendance',
    row: 'row',
    rows: 'rows',
    bulkOk: (count: number, errorNote: string) => `${count} students were enrolled from the file${errorNote}.`,
    withErrors: (count: number, word: string) => ` (${count} ${word} with an error)`,
    enrolledStudents: 'Enrolled students',
    noEnrollments: "No one is enrolled in this section yet.",
    student: 'Student',
    status: 'Status',
    certificate: 'Certificate',
    progress: 'Progress',
    notes: 'Notes',
    profile: 'Profile',
    actions: 'Actions',
    active: 'Active',
    notIssued: 'Not issued',
    view: 'View',
    edit: 'Edit',
    viewSupport: 'View supporting docs',
    markCompleted: 'Mark completed',
    supportTitle: 'Supporting document (optional): withdrawal letter, justification, etc.',
    withdraw: 'Withdraw',
    enrollStudent: 'Enroll a student',
    enrollHelp: "If the email doesn't have an account on the platform yet, it's created automatically (with the name you enter below); when that person logs in for the first time, they'll find this enrollment already set up.",
    emailPlaceholder: "Student's email",
    fullNamePlaceholder: 'Full name (only if it\'s a new person)',
    enroll: 'Enroll',
    bulkEnroll: 'Enroll several at once (CSV)',
    bulkHelp: (code: string) => `A file with two comma-separated columns: ${code}, one row per student. If a row fails, the rest are still enrolled — at the end it shows which rows failed and why.`,
    uploadCsv: 'Upload CSV',
    importTitle: 'Import historical enrollments (CSV)',
    importHelp: "To bring in a roster from another system, each with its own status and date — this doesn't enroll people \"today\", it records what already happened. Columns: email, full name (optional), status (active/completed/dropped), enrollment date YYYY-MM-DD (optional).",
    importOk: (count: number, errorNote: string) => `${count} historical enrollments were imported${errorNote}.`,
    withErrorsImport: (count: number, word: string) => ` (${count} ${word} with an error)`,
    importSubmit: 'Import',
  },
};

export default async function SectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; sectionId: string }>;
  searchParams: Promise<{
    error?: string;
    bulkOk?: string;
    bulkErrors?: string;
    importOk?: string;
    importErrors?: string;
  }>;
}) {
  const { courseId, sectionId } = await params;
  const { error, bulkOk, bulkErrors, importOk, importErrors } = await searchParams;
  const parsedBulkErrors: Array<{ email: string; message?: string }> = bulkErrors
    ? JSON.parse(bulkErrors)
    : [];
  const parsedImportErrors: Array<{ email: string; message?: string }> = importErrors
    ? JSON.parse(importErrors)
    : [];
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];
  const ESTADO_LABEL = ESTADO_LABEL_BY_LOCALE[locale];

  let section: Section;
  let enrollments: EnrollmentRow[];
  try {
    section = await apiFetch<Section>(token, `/courses/${courseId}/sections/${sectionId}`);
    enrollments = await apiFetch<EnrollmentRow[]>(
      token,
      `/courses/${courseId}/sections/${sectionId}/enrollments`,
    );
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const permissions = await getCoursePermissions(token, courseId);
  const canEnroll = can(permissions, 'enrollment', 'create');
  const canImportHistorical = can(permissions, 'enrollment', 'bulk_import');
  const canChangeStatus = can(permissions, 'enrollment', 'delete');
  const canViewAttendance = can(permissions, 'attendance', 'view');
  const canViewNotes = can(permissions, 'student_note', 'view');
  const canEditProfile = can(permissions, 'user_profile', 'edit');
  const canViewProgress = can(permissions, 'student_progress', 'view');

  return (
    <div>
      <Link href={`/cursos/${courseId}`} className="text-sm text-muted hover:text-primary">
        {t.course}
      </Link>
      <PageHeader
        title={t.sectionTitle(section.name)}
        actions={
          canViewAttendance && (
            <LinkButton href={`/cursos/${courseId}/secciones/${sectionId}/asistencia`} variant="secondary">
              {t.takeAttendance}
            </LinkButton>
          )
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {bulkOk !== undefined && (
        <Card className="mb-6 border-success/30 bg-success-bg text-sm text-success">
          <p>
            {t.bulkOk(
              Number(bulkOk),
              parsedBulkErrors.length > 0
                ? t.withErrors(parsedBulkErrors.length, parsedBulkErrors.length === 1 ? t.row : t.rows)
                : '',
            )}
          </p>
          {parsedBulkErrors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-danger">
              {parsedBulkErrors.map((e, i) => (
                <li key={i}>
                  {e.email}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {importOk !== undefined && (
        <Card className="mb-6 border-success/30 bg-success-bg text-sm text-success">
          <p>
            {t.importOk(
              Number(importOk),
              parsedImportErrors.length > 0
                ? t.withErrorsImport(parsedImportErrors.length, parsedImportErrors.length === 1 ? t.row : t.rows)
                : '',
            )}
          </p>
          {parsedImportErrors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-danger">
              {parsedImportErrors.map((e, i) => (
                <li key={i}>
                  {e.email}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <h2 className="mb-3 text-lg font-medium">{t.enrolledStudents}</h2>
      {enrollments.length === 0 ? (
        <Card className="mb-8 text-sm text-muted">{t.noEnrollments}</Card>
      ) : (
        <Card className="mb-8 overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-4 py-3 font-medium">{t.student}</th>
                <th className="px-4 py-3 font-medium">{t.status}</th>
                <th className="px-4 py-3 font-medium">{t.certificate}</th>
                {canViewProgress && <th className="px-4 py-3 font-medium">{t.progress}</th>}
                {canViewNotes && <th className="px-4 py-3 font-medium">{t.notes}</th>}
                {canEditProfile && <th className="px-4 py-3 font-medium">{t.profile}</th>}
                {canChangeStatus && <th className="px-4 py-3 font-medium">{t.actions}</th>}
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b border-border align-top last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.student.fullName}</p>
                    <p className="text-xs text-muted">{e.student.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={ESTADO_TONE[e.status]}>{ESTADO_LABEL[e.status] ?? e.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/matriculas/${e.id}/certificados`}>
                      <Badge tone={e.hasCertificate ? 'success' : 'neutral'}>
                        {e.hasCertificate ? t.active : t.notIssued}
                      </Badge>
                    </Link>
                  </td>
                  {canViewProgress && (
                    <td className="px-4 py-3">
                      <Link href={`/matriculas/${e.id}/avance`} className="text-primary hover:underline">
                        {t.view}
                      </Link>
                    </td>
                  )}
                  {canViewNotes && (
                    <td className="px-4 py-3">
                      <Link href={`/matriculas/${e.id}/notas`} className="text-primary hover:underline">
                        {t.view}
                      </Link>
                    </td>
                  )}
                  {canEditProfile && (
                    <td className="px-4 py-3">
                      <Link
                        href={`/usuarios/${e.student.userTenantId}/perfil`}
                        className="text-primary hover:underline"
                      >
                        {t.edit}
                      </Link>
                    </td>
                  )}
                  {canChangeStatus && (
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-2">
                        <Link
                          href={`/cursos/${courseId}/secciones/${sectionId}/enrollments/${e.id}/sustentos`}
                          className="text-xs text-primary hover:underline"
                        >
                          {t.viewSupport}
                        </Link>
                        {e.status !== 'completed' && (
                          <form action={cambiarEstadoMatricula.bind(null, courseId, sectionId, e.id, 'completed')}>
                            <button type="submit" className="text-xs font-medium text-success hover:underline">
                              {t.markCompleted}
                            </button>
                          </form>
                        )}
                        {e.status === 'active' && (
                          <form
                            action={retirarConSustento.bind(null, courseId, sectionId, e.id)}
                            className="flex flex-col gap-1"
                          >
                            <input
                              name="file"
                              type="file"
                              title={t.supportTitle}
                              className={'w-40 ' + fileInputClasses}
                            />
                            <button type="submit" className="text-xs font-medium text-danger hover:underline">
                              {t.withdraw}
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {canEnroll && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-1 text-base font-medium">{t.enrollStudent}</h2>
            <p className="mb-4 text-sm text-muted">{t.enrollHelp}</p>
            <form action={matricular.bind(null, courseId, sectionId)} className="flex flex-col gap-3">
              <input
                name="email"
                type="email"
                required
                placeholder={t.emailPlaceholder}
                className={fieldClasses}
              />
              <input
                name="fullName"
                type="text"
                placeholder={t.fullNamePlaceholder}
                className={fieldClasses}
              />
              <Button type="submit" className="self-start">
                {t.enroll}
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-1 text-base font-medium">{t.bulkEnroll}</h2>
            <p className="mb-4 text-sm text-muted">{t.bulkHelp('email,nombre completo')}</p>
            <form
              action={matricularCSV.bind(null, courseId, sectionId)}
              className="flex flex-col gap-3"
            >
              <input name="file" type="file" accept=".csv,text/csv" required className={fileInputClasses} />
              <Button type="submit" variant="secondary" className="self-start">
                {t.uploadCsv}
              </Button>
            </form>
          </Card>

          {canImportHistorical && (
            <Card className="lg:col-span-2">
              <h2 className="mb-1 text-base font-medium">{t.importTitle}</h2>
              <p className="mb-4 text-sm text-muted">{t.importHelp}</p>
              <form
                action={importarMatriculaHistoricaCSV.bind(null, courseId, sectionId)}
                className="flex flex-col gap-3"
              >
                <input name="file" type="file" accept=".csv,text/csv" required className={fileInputClasses} />
                <Button type="submit" variant="secondary" className="self-start">
                  {t.importSubmit}
                </Button>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
