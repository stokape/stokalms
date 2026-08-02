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

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { subirRecurso, crearRecursoEnlace, eliminarRecurso } from './actions';

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

const TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  pdf: 'PDF',
  scorm: 'Paquete SCORM',
  doc: 'Documento',
  link: 'Enlace externo',
};

export default async function LeccionDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseId, moduleId, lessonId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();

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

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/cursos/${courseId}/modulos/${moduleId}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Módulo
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{lesson.title}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {lesson.content && (
        <p className="mb-8 whitespace-pre-wrap rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          {lesson.content}
        </p>
      )}

      <h2 className="mb-3 text-lg font-medium">Recursos</h2>
      {resources.length === 0 ? (
        <p className="mb-8 text-zinc-500">
          Esta lección todavía no tiene ningún archivo ni enlace adjunto.
        </p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {resources.map((resource) => (
            <li key={resource.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <a
                  href={resource.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {resource.metadata.title ?? resource.metadata.originalName ?? resource.downloadUrl}
                </a>
                <p className="text-sm text-zinc-500">
                  {TYPE_LABELS[resource.type] ?? resource.type}
                  {resource.metadata.size !== undefined &&
                    ` · ${(resource.metadata.size / 1024 / 1024).toFixed(1)} MB`}
                </p>
              </div>
              <form action={eliminarRecurso.bind(null, courseId, moduleId, lessonId, resource.id)}>
                <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-medium">Subir un archivo</h2>
          <p className="mb-3 text-sm text-zinc-500">
            Video, PDF o un paquete SCORM comprimido en .zip — se detecta el tipo automáticamente.
          </p>
          <form
            action={subirRecurso.bind(null, courseId, moduleId, lessonId)}
            className="flex flex-col gap-3"
          >
            <input
              name="title"
              type="text"
              placeholder="Nombre para mostrar (opcional)"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input name="file" type="file" required className="text-sm" />
            <button
              type="submit"
              className="self-start rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Subir archivo
            </button>
          </form>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-medium">Agregar un enlace</h2>
          <p className="mb-3 text-sm text-zinc-500">
            Ej. una clase en vivo por Zoom/Meet, o un video de YouTube.
          </p>
          <form
            action={crearRecursoEnlace.bind(null, courseId, moduleId, lessonId)}
            className="flex flex-col gap-3"
          >
            <input
              name="title"
              type="text"
              required
              placeholder='Ej. "Clase en vivo del jueves"'
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
              placeholder="Descripción (opcional)"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="submit"
              className="self-start rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Agregar enlace
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
