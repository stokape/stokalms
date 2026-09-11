// ============================================================================
// .../enrollments/[enrollmentId]/sustentos/page.tsx — Archivos de respaldo
// adjuntos a una matrícula (ej. carta de retiro) — ver
// apps/api/.../enrollment-attachment.controller.ts. Se suben normalmente
// desde el formulario de "Retirar" (ver secciones/[sectionId]/page.tsx),
// pero esta pantalla permite verlos despues y subir alguno adicional.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getLocale } from '@/lib/locale';
import { SustentoForm } from './SustentoForm';

const TEXT = {
  es: {
    back: 'Sección',
    coursesBreadcrumb: 'Cursos',
    title: 'Sustentos de la matrícula',
    empty: 'Todavía no se subió ningún archivo de respaldo.',
    descriptionPlaceholder: 'Descripción (opcional)',
    submit: 'Subir archivo',
    submitting: 'Subiendo…',
  },
  en: {
    back: 'Section',
    coursesBreadcrumb: 'Courses',
    title: 'Enrollment supporting documents',
    empty: 'No supporting files have been uploaded yet.',
    descriptionPlaceholder: 'Description (optional)',
    submit: 'Upload file',
    submitting: 'Uploading…',
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
}: {
  params: Promise<{ courseId: string; sectionId: string; enrollmentId: string }>;
}) {
  const { courseId, sectionId, enrollmentId } = await params;
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

      <SustentoForm
        courseId={courseId}
        sectionId={sectionId}
        enrollmentId={enrollmentId}
        descriptionPlaceholder={t.descriptionPlaceholder}
        submitLabel={t.submit}
        submittingLabel={t.submitting}
      />
    </div>
  );
}
