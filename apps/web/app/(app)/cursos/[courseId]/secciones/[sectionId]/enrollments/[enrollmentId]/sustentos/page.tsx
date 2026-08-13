// ============================================================================
// .../enrollments/[enrollmentId]/sustentos/page.tsx — Archivos de respaldo
// adjuntos a una matrícula (ej. carta de retiro) — ver
// apps/api/.../enrollment-attachment.controller.ts. Se suben normalmente
// desde el formulario de "Retirar" (ver secciones/[sectionId]/page.tsx),
// pero esta pantalla permite verlos despues y subir alguno adicional.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getLocale } from '@/lib/locale';
import { subirSustento } from './actions';

const TEXT = {
  es: {
    back: 'Sección',
    coursesBreadcrumb: 'Cursos',
    title: 'Sustentos de la matrícula',
    empty: 'Todavía no se subió ningún archivo de respaldo.',
    descriptionPlaceholder: 'Descripción (opcional)',
    submit: 'Subir archivo',
  },
  en: {
    back: 'Section',
    coursesBreadcrumb: 'Courses',
    title: 'Enrollment supporting documents',
    empty: 'No supporting files have been uploaded yet.',
    descriptionPlaceholder: 'Description (optional)',
    submit: 'Upload file',
  },
};

interface Attachment {
  id: string;
  fileName: string;
  description: string | null;
  createdAt: string;
  uploadedBy: { fullName: string };
  downloadUrl: string;
}

export default async function SustentosPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; sectionId: string; enrollmentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseId, sectionId, enrollmentId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];

  let attachments: Attachment[];
  try {
    attachments = await apiFetch<Attachment[]>(
      token,
      `/courses/${courseId}/sections/${sectionId}/enrollments/${enrollmentId}/attachments`,
    );
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Solo para el breadcrumb — best-effort, ver la misma nota en
  // modulos/[moduleId]/[lessonId]/page.tsx.
  let courseTitle = '';
  let sectionName = '';
  try {
    const [course, section] = await Promise.all([
      apiFetch<{ title: string }>(token, `/courses/${courseId}`),
      apiFetch<{ name: string }>(token, `/courses/${courseId}/sections/${sectionId}`),
    ]);
    courseTitle = course.title;
    sectionName = section.name;
  } catch {
    // Intencionalmente silencioso.
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs
        items={[
          { label: t.coursesBreadcrumb, href: '/cursos' },
          { label: courseTitle || courseId, href: `/cursos/${courseId}` },
          { label: sectionName || t.back, href: `/cursos/${courseId}/secciones/${sectionId}` },
          { label: t.title },
        ]}
      />
      <h1 className="mt-1 mb-6 text-2xl font-semibold">{t.title}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="mb-8 text-zinc-500">{t.empty}</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {attachments.map((a) => (
            <li key={a.id} className="py-3">
              <a href={a.downloadUrl} target="_blank" rel="noreferrer" className="hover:underline">
                {a.fileName}
              </a>
              {a.description && <p className="text-sm text-zinc-500">{a.description}</p>}
              <p className="text-xs text-zinc-500">
                {a.uploadedBy.fullName} ·{' '}
                {new Date(a.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        action={subirSustento.bind(null, courseId, sectionId, enrollmentId)}
        className="flex max-w-sm flex-col gap-3"
      >
        <input name="file" type="file" required className="text-sm" />
        <input
          name="description"
          type="text"
          placeholder={t.descriptionPlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="submit" className="self-start">
          {t.submit}
        </Button>
      </form>
    </div>
  );
}
