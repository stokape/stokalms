// ============================================================================
// cursos/[courseId]/page.tsx — Detalle de un curso: sus secciones (para
// entrar a matricular/ver estudiantes) y un enlace a la nota final.
//
// "[courseId]" en el nombre de la carpeta es un segmento DINAMICO de
// Next.js: captura lo que venga en esa parte de la URL (ej. "/cursos/abc-123")
// y lo entrega en "params.courseId".
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getCoursePermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { selectClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import { asignarEscalaDeNotas, asignarPlantillaDeCertificado } from './actions';

const TEXT = {
  es: {
    back: '← Cursos',
    assign: 'Asignar',
    noGradingScale: 'Este curso todavía no tiene una escala de notas asignada — hasta que le asignes una, la pantalla de notas finales no va a poder calcular nada.',
    noGradingScaleEmpty: 'Tu institución todavía no creó ninguna escala de notas.',
    noTemplate: 'Este curso todavía no tiene una plantilla de certificado asignada — hasta que le asignes una, no se van a poder emitir certificados para sus matrículas.',
    noTemplateEmpty: 'Tu institución todavía no creó ninguna plantilla de certificado.',
    viewContent: 'Ver contenido del curso',
    viewAssessments: 'Ver evaluaciones',
    viewGrades: 'Ver notas finales del curso',
    sections: 'Secciones',
    createSection: '+ Crear sección',
    noSections: 'Este curso todavía no tiene secciones.',
    capacity: 'Cupo',
    noLimit: 'sin límite',
  },
  en: {
    back: '← Courses',
    assign: 'Assign',
    noGradingScale: "This course doesn't have a grading scale assigned yet — until you assign one, the final grades screen won't be able to calculate anything.",
    noGradingScaleEmpty: "Your institution hasn't created any grading scales yet.",
    noTemplate: "This course doesn't have a certificate template assigned yet — until you assign one, certificates can't be issued for its enrollments.",
    noTemplateEmpty: "Your institution hasn't created any certificate templates yet.",
    viewContent: 'View course content',
    viewAssessments: 'View assessments',
    viewGrades: "View course's final grades",
    sections: 'Sections',
    createSection: '+ Create section',
    noSections: "This course doesn't have any sections yet.",
    capacity: 'Capacity',
    noLimit: 'no limit',
  },
};

interface Course {
  id: string;
  code: string;
  title: string;
  gradingScaleId: string | null;
  certificateTemplateId: string | null;
}

interface Section {
  id: string;
  name: string;
  capacity: number;
}

interface GradingScale {
  id: string;
  name: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
}

function PendingSetupCard({
  message,
  emptyMessage,
  isEmpty,
  action,
  fieldName,
  options,
  assignLabel,
}: {
  message: string;
  emptyMessage: string;
  isEmpty: boolean;
  action: (formData: FormData) => Promise<void>;
  fieldName: string;
  options: { id: string; name: string }[];
  assignLabel: string;
}) {
  return (
    <Card className="mb-6 border-warning/30 bg-warning-bg">
      <p className="mb-3 text-sm text-warning">{message}</p>
      {isEmpty ? (
        <p className="text-sm text-warning">{emptyMessage}</p>
      ) : (
        <form action={action} className="flex max-w-sm flex-wrap gap-2">
          <select name={fieldName} required className={selectClasses + ' flex-1'}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="md">
            {assignLabel}
          </Button>
        </form>
      )}
    </Card>
  );
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let course: Course;
  try {
    course = await apiFetch<Course>(token, `/courses/${courseId}`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Sin escala de notas asignada, el curso no puede calcular ninguna nota
  // final (ver la validacion en GradebookService.computeCourseGrades, en
  // el backend) — se detecto probando de verdad que un curso de prueba se
  // habia quedado sin ninguna escala asignada, y la pagina de notas
  // mostraba el mensaje TECNICO del backend ("...PATCH /courses/:id...")
  // tal cual a un usuario final, sin ninguna pantalla desde donde
  // solucionarlo. Este formulario cierra ese hueco. Igual que las
  // secciones, se pide en un try/catch separado: un Docente (sin
  // "grading_scale:view") puede perfectamente ver el curso sin ver esto.
  let gradingScales: GradingScale[] | null = null;
  if (!course.gradingScaleId) {
    try {
      gradingScales = await apiFetch<GradingScale[]>(token, '/grading-scales');
    } catch {
      gradingScales = null;
    }
  }

  // Las secciones se piden en un try/catch SEPARADO del curso: un Docente
  // (sin "section:view", ver prisma/seed.js) puede tener perfecto sentido
  // para ver el curso y su nota final, pero no la lista administrativa de
  // secciones/matriculados — eso no deberia tumbar TODA la pagina, solo
  // ocultar esa seccion (mismo patron que las plantillas en
  // matriculas/[enrollmentId]/certificados/page.tsx).
  let sections: Section[] | null = null;
  try {
    sections = await apiFetch<Section[]>(token, `/courses/${courseId}/sections`);
  } catch {
    sections = null;
  }

  // Misma logica que la escala de notas: sin plantilla asignada, emitir un
  // certificado para este curso queda bloqueado (ver certificate.service.ts,
  // "issue") — este formulario resuelve eso desde el propio curso, en vez de
  // descubrirlo recien al intentar emitir.
  let templates: CertificateTemplate[] | null = null;
  if (!course.certificateTemplateId) {
    try {
      templates = await apiFetch<CertificateTemplate[]>(token, '/certificate-templates');
    } catch {
      templates = null;
    }
  }

  const permissions = await getCoursePermissions(token, courseId);
  const canCreateSection = can(permissions, 'section', 'create');

  return (
    <div>
      <Link href="/cursos" className="text-sm text-muted hover:text-primary">
        {t.back}
      </Link>
      <PageHeader title={course.title} description={<span className="font-mono">{course.code}</span>} />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {!course.gradingScaleId && gradingScales && (
        <PendingSetupCard
          message={t.noGradingScale}
          emptyMessage={t.noGradingScaleEmpty}
          isEmpty={gradingScales.length === 0}
          action={asignarEscalaDeNotas.bind(null, courseId)}
          fieldName="gradingScaleId"
          options={gradingScales}
          assignLabel={t.assign}
        />
      )}

      {!course.certificateTemplateId && templates && (
        <PendingSetupCard
          message={t.noTemplate}
          emptyMessage={t.noTemplateEmpty}
          isEmpty={templates.length === 0}
          action={asignarPlantillaDeCertificado.bind(null, courseId)}
          fieldName="certificateTemplateId"
          options={templates}
          assignLabel={t.assign}
        />
      )}

      <div className="mb-8 flex flex-wrap gap-2">
        <LinkButton href={`/cursos/${courseId}/modulos`} variant="secondary">
          {t.viewContent}
        </LinkButton>
        <LinkButton href={`/cursos/${courseId}/evaluaciones`} variant="secondary">
          {t.viewAssessments}
        </LinkButton>
        <LinkButton href={`/cursos/${courseId}/notas`} variant="secondary">
          {t.viewGrades}
        </LinkButton>
      </div>

      {sections && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">{t.sections}</h2>
            {canCreateSection && (
              <Link href={`/cursos/${courseId}/secciones/nueva`} className="text-sm font-medium text-primary hover:underline">
                {t.createSection}
              </Link>
            )}
          </div>
          {sections.length === 0 ? (
            <Card className="text-sm text-muted">{t.noSections}</Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sections.map((section) => (
                <Link key={section.id} href={`/cursos/${courseId}/secciones/${section.id}`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <p className="font-medium">{section.name}</p>
                    <p className="text-sm text-muted">
                      {t.capacity}: {section.capacity > 0 ? section.capacity : t.noLimit}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
