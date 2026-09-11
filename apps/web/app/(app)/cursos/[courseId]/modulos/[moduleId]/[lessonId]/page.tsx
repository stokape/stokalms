// ============================================================================
// .../[lessonId]/page.tsx — Detalle de una Lección: su contenido de texto y
// sus Recursos (archivos subidos o enlaces externos, ver
// apps/api/src/modules/content/resource.service.ts).
//
// El contenido de la lección se muestra como TEXTO PLANO (whitespace-pre-wrap),
// no como HTML interpretado: aceptar HTML arbitrario que un docente escribió
// y renderizarlo tal cual a un estudiante sería una puerta abierta a XSS
// (a diferencia de las plantillas de certificado, que se ven dentro de un
// <iframe sandbox="">, aislado del resto de la página — ver
// plantillas-certificado/[templateId]/page.tsx).
// ============================================================================

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAccessToken, apiFetch, toErrorMessage, getCoursePermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getLocale, type Locale } from '@/lib/locale';
import {
  ActualizarLeccionForm,
  GenerarPreguntasIA,
  EliminarRecursoButton,
  ActualizarRecursoForm,
  SubirRecursoForm,
  CrearRecursoEnlaceForm,
} from './LessonForms';

interface Lesson {
  id: string;
  title: string;
  content: string;
}

interface Resource {
  id: string;
  type: string;
  downloadUrl: string;
  metadata: { title?: string; originalName?: string; size?: number; description?: string };
}

const TYPE_LABELS_BY_LOCALE: Record<Locale, Record<string, string>> = {
  es: {
    video: 'Video', pdf: 'PDF', scorm: 'Paquete SCORM', image: 'Imagen',
    presentation: 'Presentación (PowerPoint)', spreadsheet: 'Hoja de cálculo (Excel)',
    document: 'Documento (Word)', doc: 'Documento', link: 'Enlace externo',
  },
  en: {
    video: 'Video', pdf: 'PDF', scorm: 'SCORM package', image: 'Image',
    presentation: 'Presentation (PowerPoint)', spreadsheet: 'Spreadsheet (Excel)',
    document: 'Document (Word)', doc: 'Document', link: 'External link',
  },
};

const TEXT = {
  es: {
    backToModule: 'Módulo',
    coursesBreadcrumb: 'Cursos',
    contentBreadcrumb: 'Contenido',
    contentPlaceholder: 'Texto de la lección',
    saveChanges: 'Guardar cambios',
    savingChanges: 'Guardando…',
    resources: 'Recursos',
    noResources: 'Esta lección todavía no tiene ningún archivo ni enlace adjunto.',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar este recurso? No se puede deshacer.',
    titlePlaceholder: 'Título',
    descriptionPlaceholder: 'Descripción',
    save: 'Guardar',
    saving: 'Guardando…',
    uploadFile: 'Subir un archivo',
    uploadFileHelp: 'PDF, Word, Excel, PowerPoint, imágenes (JPG/PNG), videos, o un paquete SCORM comprimido en .zip — se detecta el tipo automáticamente.',
    displayNamePlaceholder: 'Nombre para mostrar (opcional)',
    uploadFileSubmit: 'Subir archivo',
    uploadingFile: 'Subiendo…',
    addLink: 'Agregar un enlace',
    addLinkHelp: 'Ej. una clase en vivo por Zoom/Meet, o un video de YouTube.',
    linkTitlePlaceholder: 'Ej. "Clase en vivo del jueves"',
    descriptionOptionalPlaceholder: 'Descripción (opcional)',
    addLinkSubmit: 'Agregar enlace',
    addingLink: 'Agregando…',
    aiGenerate: 'Generar preguntas con IA (beta)',
    aiGenerating: 'Generando…',
    aiNotConfigured: 'Esta institución todavía no tiene configurado un proveedor de IA — hablalo con tu equipo técnico.',
    aiResultTitle: 'Preguntas generadas (borrador)',
    aiResultHelp: 'Son un borrador para revisar — cárgalas a mano en una evaluación si te sirven, ninguna se guardó sola.',
    aiCorrect: 'Correcta',
  },
  en: {
    backToModule: 'Module',
    coursesBreadcrumb: 'Courses',
    contentBreadcrumb: 'Content',
    contentPlaceholder: 'Lesson text',
    saveChanges: 'Save changes',
    savingChanges: 'Saving…',
    resources: 'Resources',
    noResources: "This lesson doesn't have any files or links attached yet.",
    delete: 'Delete',
    deleteConfirm: "Delete this resource? This can't be undone.",
    titlePlaceholder: 'Title',
    descriptionPlaceholder: 'Description',
    save: 'Save',
    saving: 'Saving…',
    uploadFile: 'Upload a file',
    uploadFileHelp: 'PDF, Word, Excel, PowerPoint, images (JPG/PNG), videos, or a zipped SCORM package — the type is detected automatically.',
    displayNamePlaceholder: 'Display name (optional)',
    uploadFileSubmit: 'Upload file',
    uploadingFile: 'Uploading…',
    addLink: 'Add a link',
    addLinkHelp: 'E.g. a live class on Zoom/Meet, or a YouTube video.',
    linkTitlePlaceholder: 'E.g. "Thursday live class"',
    descriptionOptionalPlaceholder: 'Description (optional)',
    addLinkSubmit: 'Add link',
    addingLink: 'Adding…',
    aiGenerate: 'Generate questions with AI (beta)',
    aiGenerating: 'Generating…',
    aiNotConfigured: "This institution hasn't configured an AI provider yet — talk to your technical team.",
    aiResultTitle: 'Generated questions (draft)',
    aiResultHelp: "They're a draft to review — add them by hand to an assessment if they're useful, none were saved on their own.",
    aiCorrect: 'Correct',
  },
};

export default async function LeccionDetallePage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const { courseId, moduleId, lessonId } = await params;
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];
  const TYPE_LABELS = TYPE_LABELS_BY_LOCALE[locale];

  let lesson: Lesson;
  let resources: Resource[];
  try {
    [lesson, resources] = await Promise.all([
      apiFetch<Lesson>(token, `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
      apiFetch<Resource[]>(
        token,
        `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/resources`,
      ),
    ]);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Solo para el breadcrumb (ver Breadcrumbs.tsx) — best-effort: si esto
  // falla, el camino se arma con lo que ya tenemos (el título de la
  // lección) en vez de romper toda la pantalla por un dato secundario.
  let courseTitle = '';
  let moduleTitle = '';
  try {
    const [course, module] = await Promise.all([
      apiFetch<{ title: string }>(token, `/courses/${courseId}`),
      apiFetch<{ title: string }>(token, `/courses/${courseId}/modules/${moduleId}`),
    ]);
    courseTitle = course.title;
    moduleTitle = module.title;
  } catch {
    // Intencionalmente silencioso.
  }

  // Registra "avance" (ver academic-progress.service.ts) — best-effort: si
  // falla (ej. quien mira no es alumno matriculado de este curso, o el
  // backend no responde), no debe romper la lección en si, que ya se
  // terminó de cargar arriba.
  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/view`, {
      method: 'POST',
    });
  } catch {
    // Intencionalmente silencioso.
  }

  const permissions = await getCoursePermissions(token, courseId);
  const canEditLesson = can(permissions, 'lesson', 'edit');
  const canCreateResource = can(permissions, 'resource', 'create');
  const canEditResource = can(permissions, 'resource', 'edit');
  const canDeleteResource = can(permissions, 'resource', 'delete');

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs
        items={[
          { label: t.coursesBreadcrumb, href: '/cursos' },
          { label: courseTitle || courseId, href: `/cursos/${courseId}` },
          { label: t.contentBreadcrumb, href: `/cursos/${courseId}/modulos` },
          { label: moduleTitle || t.backToModule, href: `/cursos/${courseId}/modulos/${moduleId}` },
          { label: lesson.title },
        ]}
      />
      <h1 className="mt-1 mb-6 text-2xl font-semibold">{lesson.title}</h1>

      {canEditLesson ? (
        <ActualizarLeccionForm
          courseId={courseId}
          moduleId={moduleId}
          lessonId={lessonId}
          title={lesson.title}
          content={lesson.content}
          contentPlaceholder={t.contentPlaceholder}
          submitLabel={t.saveChanges}
          submittingLabel={t.savingChanges}
        />
      ) : (
        lesson.content && (
          <p className="mb-8 whitespace-pre-wrap rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            {lesson.content}
          </p>
        )
      )}

      {canEditLesson && (
        <GenerarPreguntasIA
          courseId={courseId}
          moduleId={moduleId}
          lessonId={lessonId}
          generateLabel={t.aiGenerate}
          generatingLabel={t.aiGenerating}
          notConfiguredLabel={t.aiNotConfigured}
          resultTitle={t.aiResultTitle}
          resultHelp={t.aiResultHelp}
          correctLabel={t.aiCorrect}
        />
      )}

      <h2 className="mb-3 text-lg font-medium">{t.resources}</h2>
      {resources.length === 0 ? (
        <p className="mb-8 text-zinc-500">{t.noResources}</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {resources.map((resource) => (
            <li key={resource.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-center justify-between gap-4">
                <a
                  href={resource.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {resource.metadata.title ?? resource.metadata.originalName ?? resource.downloadUrl}
                </a>
                {canDeleteResource && (
                  <EliminarRecursoButton
                    courseId={courseId}
                    moduleId={moduleId}
                    lessonId={lessonId}
                    resourceId={resource.id}
                    confirmMessage={t.deleteConfirm}
                    label={t.delete}
                  />
                )}
              </div>
              <p className="text-sm text-zinc-500">
                {TYPE_LABELS[resource.type] ?? resource.type}
                {resource.metadata.size !== undefined &&
                  ` · ${(resource.metadata.size / 1024 / 1024).toFixed(1)} MB`}
              </p>
              {canEditResource && (
                <ActualizarRecursoForm
                  courseId={courseId}
                  moduleId={moduleId}
                  lessonId={lessonId}
                  resourceId={resource.id}
                  title={resource.metadata.title ?? ''}
                  description={resource.metadata.description ?? ''}
                  url={resource.downloadUrl}
                  isLink={resource.type === 'link'}
                  titlePlaceholder={t.titlePlaceholder}
                  descriptionPlaceholder={t.descriptionPlaceholder}
                  saveLabel={t.save}
                  savingLabel={t.saving}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {canCreateResource && (
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-medium">{t.uploadFile}</h2>
            <p className="mb-3 text-sm text-zinc-500">{t.uploadFileHelp}</p>
            <SubirRecursoForm
              courseId={courseId}
              moduleId={moduleId}
              lessonId={lessonId}
              displayNamePlaceholder={t.displayNamePlaceholder}
              submitLabel={t.uploadFileSubmit}
              submittingLabel={t.uploadingFile}
            />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-medium">{t.addLink}</h2>
            <p className="mb-3 text-sm text-zinc-500">{t.addLinkHelp}</p>
            <CrearRecursoEnlaceForm
              courseId={courseId}
              moduleId={moduleId}
              lessonId={lessonId}
              linkTitlePlaceholder={t.linkTitlePlaceholder}
              descriptionPlaceholder={t.descriptionOptionalPlaceholder}
              submitLabel={t.addLinkSubmit}
              submittingLabel={t.addingLink}
            />
          </div>
        </div>
      )}
    </div>
  );
}
