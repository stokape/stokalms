// ============================================================================
// cursos/[courseId]/secciones/nueva/page.tsx — Crear una Sección nueva
// dentro de un curso. El backend soporta "POST /courses/:courseId/sections"
// desde el principio; hasta ahora no existía ninguna pantalla para usarlo
// (cursos/[courseId]/page.tsx solo LISTA las secciones ya creadas).
//
// El formulario vive en SeccionForm.tsx (Client Component) A PROPOSITO --
// ver la nota extensa en periodos/actions.ts: la Server Action ya NO llama
// a redirect(), necesita useActionState (solo disponible del lado del
// cliente).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken } from '@/lib/api';
import { getLocale } from '@/lib/locale';
import { SeccionForm } from './SeccionForm';

const TEXT = {
  es: {
    back: '← Curso',
    title: 'Crear una sección nueva',
    namePlaceholder: 'Ej. "Sección A - Turno Mañana"',
    capacity: 'Cupo máximo (0 = sin límite)',
    submit: 'Crear sección',
    submitting: 'Creando…',
  },
  en: {
    back: '← Course',
    title: 'Create a new section',
    namePlaceholder: 'E.g. "Section A - Morning shift"',
    capacity: 'Maximum capacity (0 = no limit)',
    submit: 'Create section',
    submitting: 'Creating…',
  },
};

export default async function NuevaSeccionPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  await requireAccessToken();
  const t = TEXT[await getLocale()];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${courseId}`} className="text-sm text-zinc-500 hover:underline">
        {t.back}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{t.title}</h1>

      <SeccionForm
        courseId={courseId}
        namePlaceholder={t.namePlaceholder}
        capacityLabel={t.capacity}
        submitLabel={t.submit}
        submittingLabel={t.submitting}
      />
    </div>
  );
}
