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
import { Button } from '@/components/ui/Button';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { getLocale, type Locale } from '@/lib/locale';
import {
  subirRecurso,
  crearRecursoEnlace,
  actualizarLeccion,
  actualizarRecurso,
  eliminarRecurso,
  generarPreguntasIA,
} from './actions';

interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

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
    resources: 'Recursos',
    noResources: 'Esta lección todavía no tiene ningún archivo ni enlace adjunto.',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar este recurso? No se puede deshacer.',
    titlePlaceholder: 'Título',
    descriptionPlaceholder: 'Descripción',
    save: 'Guardar',
    uploadFile: 'Subir un archivo',
    uploadFileHelp: 'PDF, Word, Excel, PowerPoint, imágenes (JPG/PNG), videos, o un paquete SCORM comprimido en .zip — se detecta el tipo automáticamente.',
    displayNamePlaceholder: 'Nombre para mostrar (opcional)',
    uploadFileSubmit: 'Subir archivo',
    addLink: 'Agregar un enlace',
    addLinkHelp: 'Ej. una clase en vivo por Zoom/Meet, o un video de YouTube.',
    linkTitlePlaceholder: 'Ej. "Clase en vivo del jueves"',
    descriptionOptionalPlaceholder: 'Descripción (opcional)',
    addLinkSubmit: 'Agregar enlace',
    aiGenerate: 'Generar preguntas con IA (beta)',
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
    resources: 'Resources',
    noResources: "This lesson doesn't have any files or links attached yet.",
    delete: 'Delete',
    deleteConfirm: "Delete this resource? This can't be undone.",
    titlePlaceholder: 'Title',
    descriptionPlaceholder: 'Description',
    save: 'Save',
    uploadFile: 'Upload a file',
    uploadFileHelp: 'PDF, Word, Excel, PowerPoint, images (JPG/PNG), videos, or a zipped SCORM package — the type is detected automatically.',
    displayNamePlaceholder: 'Display name (optional)',
    uploadFileSubmit: 'Upload file',
    addLink: 'Add a link',
    addLinkHelp: 'E.g. a live class on Zoom/Meet, or a YouTube video.',
    linkTitlePlaceholder: 'E.g. "Thursday live class"',
    descriptionOptionalPlaceholder: 'Description (optional)',
    addLinkSubmit: 'Add link',
    aiGenerate: 'Generate questions with AI (beta)',
    aiNotConfigured: "This institution hasn't configured an AI provider yet — talk to your technical team.",
    aiResultTitle: 'Generated questions (draft)',
    aiResultHelp: "They're a draft to review — add them by hand to an assessment if they're useful, none were saved on their own.",
    aiCorrect: 'Correct',
  },
};

export default async function LeccionDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
  searchParams: Promise<{ error?: string; aiQuestions?: string; aiNotConfigured?: string }>;
}) {
  const { courseId, moduleId, lessonId } = await params;
  const { error, aiQuestions: aiQuestionsParam, aiNotConfigured } = await searchParams;
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];
  const TYPE_LABELS = TYPE_LABELS_BY_LOCALE[locale];

  // Ver actions.ts, "generarPreguntasIA": el resultado viaja codificado en
  // la URL del redirect (no hay estado de cliente en esta pantalla) — si
  // decodificarlo falla por lo que sea, se trata como "sin resultado" en
  // vez de romper toda la pagina.
  let aiQuestions: GeneratedQuestion[] | null = null;
  if (aiQuestionsParam) {
    try {
      aiQuestions = JSON.parse(Buffer.from(aiQuestionsParam, 'base64url').toString('utf-8'));
    } catch {
      aiQuestions = null;
    }
  }

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

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {aiNotConfigured && (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning-bg p-4 text-sm text-warning">
          {t.aiNotConfigured}
        </div>
      )}

      {canEditLesson ? (
        <form
          action={actualizarLeccion.bind(null, courseId, moduleId, lessonId)}
          className="mb-8 flex flex-col gap-3"
        >
          <input
            name="title"
            type="text"
            defaultValue={lesson.title}
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <textarea
            name="content"
            rows={8}
            defaultValue={lesson.content}
            placeholder={t.contentPlaceholder}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="self-start rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {t.saveChanges}
          </button>
        </form>
      ) : (
        lesson.content && (
          <p className="mb-8 whitespace-pre-wrap rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            {lesson.content}
          </p>
        )
      )}

      {canEditLesson && (
        <div className="mb-8">
          <form action={generarPreguntasIA.bind(null, courseId, moduleId, lessonId)}>
            <Button type="submit" variant="secondary" size="sm">
              {t.aiGenerate}
            </Button>
          </form>

          {aiQuestions && aiQuestions.length > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-black/[.015] p-4 dark:bg-white/[.02]">
              <h3 className="mb-1 text-sm font-semibold">{t.aiResultTitle}</h3>
              <p className="mb-3 text-xs text-muted">{t.aiResultHelp}</p>
              <ol className="flex flex-col gap-4 text-sm">
                {aiQuestions.map((q, i) => (
                  <li key={i}>
                    <p className="font-medium">
                      {i + 1}. {q.prompt}
                    </p>
                    <ul className="mt-1.5 flex flex-col gap-1 pl-4">
                      {q.options.map((opt, j) => (
                        <li key={j} className={j === q.correctIndex ? 'font-medium text-success' : 'text-muted'}>
                          {opt}
                          {j === q.correctIndex && ` — ${t.aiCorrect}`}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
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
                  <form action={eliminarRecurso.bind(null, courseId, moduleId, lessonId, resource.id)}>
                    <ConfirmSubmitButton
                      className="text-xs text-red-600 underline dark:text-red-400"
                      confirmMessage={t.deleteConfirm}
                    >
                      {t.delete}
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
              <p className="text-sm text-zinc-500">
                {TYPE_LABELS[resource.type] ?? resource.type}
                {resource.metadata.size !== undefined &&
                  ` · ${(resource.metadata.size / 1024 / 1024).toFixed(1)} MB`}
              </p>
              {canEditResource && (
                <form
                  action={actualizarRecurso.bind(null, courseId, moduleId, lessonId, resource.id)}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    name="title"
                    type="text"
                    defaultValue={resource.metadata.title ?? ''}
                    placeholder={t.titlePlaceholder}
                    className="w-48 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <input
                    name="description"
                    type="text"
                    defaultValue={resource.metadata.description ?? ''}
                    placeholder={t.descriptionPlaceholder}
                    className="w-48 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  {resource.type === 'link' && (
                    <input
                      name="url"
                      type="url"
                      defaultValue={resource.downloadUrl}
                      placeholder="https://..."
                      className="w-48 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  )}
                  <button type="submit" className="text-xs underline">
                    {t.save}
                  </button>
                </form>
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
            <form
              action={subirRecurso.bind(null, courseId, moduleId, lessonId)}
              className="flex flex-col gap-3"
            >
              <input
                name="title"
                type="text"
                placeholder={t.displayNamePlaceholder}
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                name="file"
                type="file"
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,image/*,video/*,.zip"
                className="text-sm"
              />
              <Button type="submit" className="self-start">
                {t.uploadFileSubmit}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-medium">{t.addLink}</h2>
            <p className="mb-3 text-sm text-zinc-500">{t.addLinkHelp}</p>
            <form
              action={crearRecursoEnlace.bind(null, courseId, moduleId, lessonId)}
              className="flex flex-col gap-3"
            >
              <input
                name="title"
                type="text"
                required
                placeholder={t.linkTitlePlaceholder}
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                name="url"
                type="url"
                required
                placeholder="https://..."
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                name="description"
                type="text"
                placeholder={t.descriptionOptionalPlaceholder}
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <Button type="submit" className="self-start">
                {t.addLinkSubmit}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
