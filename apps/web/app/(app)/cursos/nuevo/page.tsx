// ============================================================================
// cursos/nuevo/page.tsx — Crear un Curso nuevo.
//
// El periodo académico es OPCIONAL (ver create-course.dto.ts): antes, sin
// ningún periodo creado, esta pantalla mostraba solo un aviso con un enlace
// a /periodos, bloqueando por completo la creación del primer curso de una
// institución nueva. Hoy el formulario siempre se muestra, con "Sin periodo
// (asignar después)" como opción — y quien prefiera crear uno ahí mismo
// puede hacerlo desde el popup de abajo, sin perder lo que ya completó acá
// (código, nombre, etc.).
//
// El checkbox + popup viven FUERA del <form> del curso a propósito: el
// popup tiene su PROPIO <form> (apunta a otra Server Action,
// crearPeriodoDesdeCurso) — un <form> dentro de otro <form> es HTML
// inválido y el navegador lo maneja de forma impredecible. El checkbox
// oculto (mismo patrón que "nav-toggle" en (app)/layout.tsx) solo necesita
// ser HERMANO del bloque que muestra/oculta vía "peer-checked" — el
// <label> que lo activa sí puede vivir dentro del form del curso sin
// problema, un <label> se vincula por "htmlFor"/id, no por posición en el
// DOM.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { Button } from '@/components/ui/Button';
import { fieldClasses, labelClasses, selectClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import { crearCurso, crearPeriodoDesdeCurso } from './actions';

const TEXT = {
  es: {
    back: '← Cursos',
    title: 'Crear un curso nuevo',
    term: 'Periodo académico',
    noTerm: 'Sin periodo (asignar después)',
    createTermToggle: '+ Crear un periodo nuevo',
    termCreated: (name: string) => `Periodo "${name}" creado y seleccionado.`,
    codePlaceholder: 'Código (ej. "CONT-101")',
    titlePlaceholder: 'Nombre del curso',
    gradingScale: 'Escala de notas (opcional, se puede asignar después)',
    template: 'Plantilla de certificado (opcional, se puede asignar después)',
    unassigned: 'Sin asignar todavía',
    submit: 'Crear curso',
    modalTitle: 'Crear un periodo nuevo',
    modalName: 'Nombre',
    modalNamePlaceholder: 'Ej. "2026 - Semestre I"',
    modalStart: 'Fecha de inicio',
    modalEnd: 'Fecha de fin',
    modalSubmit: 'Crear periodo',
    modalCancel: 'Cancelar',
  },
  en: {
    back: '← Courses',
    title: 'Create a new course',
    term: 'Academic term',
    noTerm: 'No term (assign later)',
    createTermToggle: '+ Create a new term',
    termCreated: (name: string) => `Term "${name}" created and selected.`,
    codePlaceholder: 'Code (e.g. "CONT-101")',
    titlePlaceholder: 'Course name',
    gradingScale: 'Grading scale (optional, can be assigned later)',
    template: 'Certificate template (optional, can be assigned later)',
    unassigned: 'Not assigned yet',
    submit: 'Create course',
    modalTitle: 'Create a new term',
    modalName: 'Name',
    modalNamePlaceholder: 'E.g. "2026 - Term I"',
    modalStart: 'Start date',
    modalEnd: 'End date',
    modalSubmit: 'Create term',
    modalCancel: 'Cancel',
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
  searchParams: Promise<{ error?: string; termCreado?: string }>;
}) {
  const { error, termCreado } = await searchParams;
  const token = await requireAccessToken();
  const tr = TEXT[await getLocale()];

  let terms: Term[];
  try {
    terms = await apiFetch<Term[]>(token, '/terms');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const createdTerm = termCreado ? terms.find((t) => t.id === termCreado) : undefined;

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
      <Link href="/cursos" className="text-sm text-muted hover:underline">
        {tr.back}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{tr.title}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {createdTerm && <SuccessBanner>{tr.termCreated(createdTerm.name)}</SuccessBanner>}

      {/* Checkbox del popup + el popup en sí: hermanos entre sí, AMBOS
         fuera del <form> del curso (ver la nota grande arriba). */}
      <input type="checkbox" id="crear-periodo-toggle" className="peer hidden" />
      <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 p-4 peer-checked:flex">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium">{tr.modalTitle}</h2>
            <label
              htmlFor="crear-periodo-toggle"
              className="cursor-pointer text-muted hover:text-foreground"
              aria-label={tr.modalCancel}
            >
              ✕
            </label>
          </div>
          <form action={crearPeriodoDesdeCurso} className="flex flex-col gap-3">
            <label className={labelClasses} htmlFor="new-term-name">
              {tr.modalName}
              <input
                id="new-term-name"
                name="name"
                type="text"
                required
                maxLength={120}
                placeholder={tr.modalNamePlaceholder}
                className={`mt-1 ${fieldClasses}`}
              />
            </label>
            <label className={labelClasses} htmlFor="new-term-start">
              {tr.modalStart}
              <input id="new-term-start" name="startDate" type="date" required className={`mt-1 ${fieldClasses}`} />
            </label>
            <label className={labelClasses} htmlFor="new-term-end">
              {tr.modalEnd}
              <input id="new-term-end" name="endDate" type="date" required className={`mt-1 ${fieldClasses}`} />
            </label>
            <div className="mt-1 flex gap-2">
              <Button type="submit" size="sm">
                {tr.modalSubmit}
              </Button>
              <label
                htmlFor="crear-periodo-toggle"
                className="inline-flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-sm text-muted hover:text-foreground"
              >
                {tr.modalCancel}
              </label>
            </div>
          </form>
        </div>
      </div>

      <form action={crearCurso} className="flex max-w-sm flex-col gap-3">
        <label className={labelClasses} htmlFor="course-term">
          {tr.term}
          <select
            id="course-term"
            name="termId"
            defaultValue={termCreado ?? ''}
            className={`mt-1 ${selectClasses}`}
          >
            <option value="">{tr.noTerm}</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </label>
        <label
          htmlFor="crear-periodo-toggle"
          className="cursor-pointer self-start text-sm text-primary hover:underline"
        >
          {tr.createTermToggle}
        </label>

        <input
          name="code"
          type="text"
          required
          maxLength={30}
          placeholder={tr.codePlaceholder}
          className={fieldClasses}
        />
        <input
          name="title"
          type="text"
          required
          maxLength={200}
          placeholder={tr.titlePlaceholder}
          className={fieldClasses}
        />
        {gradingScales && (
          <label className={labelClasses} htmlFor="course-grading-scale">
            {tr.gradingScale}
            <select id="course-grading-scale" name="gradingScaleId" defaultValue="" className={`mt-1 ${selectClasses}`}>
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
          <label className={labelClasses} htmlFor="course-template">
            {tr.template}
            <select id="course-template" name="certificateTemplateId" defaultValue="" className={`mt-1 ${selectClasses}`}>
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
    </div>
  );
}
