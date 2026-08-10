// ============================================================================
// cursos/nuevo/page.tsx — Crear un Curso nuevo. Hasta ahora esta pantalla no
// existía: el backend soporta "POST /courses" desde el principio, pero
// nadie tenía forma de usarlo salvo por API directa. Necesita elegir un
// Periodo académico ya creado (ver ../../periodos/page.tsx) — si no hay
// ninguno, se muestra un aviso con el enlace para crear uno primero, en vez
// de un formulario roto sin opciones.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { getLocale } from '@/lib/locale';
import { crearCurso } from './actions';

const TEXT = {
  es: {
    back: '← Cursos',
    title: 'Crear un curso nuevo',
    noTermPrefix: 'Todavía no hay ningún periodo académico creado — primero',
    noTermLink: 'crea uno',
    noTermSuffix: ', después vuelve aquí para crear el curso.',
    term: 'Periodo académico',
    codePlaceholder: 'Código (ej. "CONT-101")',
    titlePlaceholder: 'Nombre del curso',
    gradingScale: 'Escala de notas (opcional, se puede asignar después)',
    template: 'Plantilla de certificado (opcional, se puede asignar después)',
    unassigned: 'Sin asignar todavía',
    submit: 'Crear curso',
  },
  en: {
    back: '← Courses',
    title: 'Create a new course',
    noTermPrefix: "There's no academic term created yet — first",
    noTermLink: 'create one',
    noTermSuffix: ', then come back here to create the course.',
    term: 'Academic term',
    codePlaceholder: 'Code (e.g. "CONT-101")',
    titlePlaceholder: 'Course name',
    gradingScale: 'Grading scale (optional, can be assigned later)',
    template: 'Certificate template (optional, can be assigned later)',
    unassigned: 'Not assigned yet',
    submit: 'Create course',
  },
};

interface Term {
  id: string;
  name: string;
}

interface GradingScale {
  id: string;
  name: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
}

export default async function NuevoCursoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const token = await requireAccessToken();
  const tr = TEXT[await getLocale()];

  let terms: Term[];
  try {
    terms = await apiFetch<Term[]>(token, '/terms');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Escala de notas y plantilla de certificado son OPCIONALES al crear un
  // curso (se pueden asignar después, ver cursos/[courseId]/page.tsx) — si
  // el rol no tiene permiso para verlas, simplemente no se ofrecen esos dos
  // selects, sin romper el resto del formulario.
  let gradingScales: GradingScale[] | null = null;
  try {
    gradingScales = await apiFetch<GradingScale[]>(token, '/grading-scales');
  } catch {
    gradingScales = null;
  }

  let templates: CertificateTemplate[] | null = null;
  try {
    templates = await apiFetch<CertificateTemplate[]>(token, '/certificate-templates');
  } catch {
    templates = null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/cursos" className="text-sm text-zinc-500 hover:underline">
        {tr.back}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{tr.title}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {terms.length === 0 ? (
        <p className="text-zinc-500">
          {tr.noTermPrefix}{' '}
          <Link href="/periodos" className="underline">
            {tr.noTermLink}
          </Link>
          {tr.noTermSuffix}
        </p>
      ) : (
        <form action={crearCurso} className="flex max-w-sm flex-col gap-3">
          <label className="text-xs text-zinc-500">
            {tr.term}
            <select
              name="termId"
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </label>
          <input
            name="code"
            type="text"
            required
            placeholder={tr.codePlaceholder}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            name="title"
            type="text"
            required
            placeholder={tr.titlePlaceholder}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          {gradingScales && (
            <label className="text-xs text-zinc-500">
              {tr.gradingScale}
              <select
                name="gradingScaleId"
                defaultValue=""
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">{tr.unassigned}</option>
                {gradingScales.map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {templates && (
            <label className="text-xs text-zinc-500">
              {tr.template}
              <select
                name="certificateTemplateId"
                defaultValue=""
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">{tr.unassigned}</option>
                {templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Button type="submit" className="self-start">
            {tr.submit}
          </Button>
        </form>
      )}
    </div>
  );
}
