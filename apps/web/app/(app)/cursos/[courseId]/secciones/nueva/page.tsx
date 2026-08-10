// ============================================================================
// cursos/[courseId]/secciones/nueva/page.tsx — Crear una Sección nueva
// dentro de un curso. El backend soporta "POST /courses/:courseId/sections"
// desde el principio; hasta ahora no existía ninguna pantalla para usarlo
// (cursos/[courseId]/page.tsx solo LISTA las secciones ya creadas).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { getLocale } from '@/lib/locale';
import { crearSeccion } from './actions';

const TEXT = {
  es: {
    back: '← Curso',
    title: 'Crear una sección nueva',
    namePlaceholder: 'Ej. "Sección A - Turno Mañana"',
    capacity: 'Cupo máximo (0 = sin límite)',
    submit: 'Crear sección',
  },
  en: {
    back: '← Course',
    title: 'Create a new section',
    namePlaceholder: 'E.g. "Section A - Morning shift"',
    capacity: 'Maximum capacity (0 = no limit)',
    submit: 'Create section',
  },
};

export default async function NuevaSeccionPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseId } = await params;
  const { error } = await searchParams;
  await requireAccessToken();
  const t = TEXT[await getLocale()];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${courseId}`} className="text-sm text-zinc-500 hover:underline">
        {t.back}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{t.title}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      <form action={crearSeccion.bind(null, courseId)} className="flex max-w-sm flex-col gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder={t.namePlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <label className="text-xs text-zinc-500">
          {t.capacity}
          <input
            name="capacity"
            type="number"
            min={0}
            defaultValue={0}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <Button type="submit" className="self-start">
          {t.submit}
        </Button>
      </form>
    </div>
  );
}
