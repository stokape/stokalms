'use client';

// ============================================================================
// CursoForms.tsx — Client Component A PROPOSITO (mismo criterio que
// periodos/PeriodosForms.tsx): "useActionState" necesita ejecutarse en el
// cliente para mostrar el error de una Server Action SIN que esta llame a
// redirect() (ver la nota extensa en actions.ts).
//
// Antes, "crear un periodo desde el popup" volvia a esta pantalla via
// redirect(`/cursos/nuevo?termCreado=<id>`) -- la URL era la unica forma de
// que el <select> de periodos se enterara del nuevo periodo. Ahora que la
// Server Action ya no redirige, ese enterarse pasa por estado de React: el
// periodo recien creado se agrega a la lista local ("terms") y se
// preselecciona, sin tocar la URL ni recargar la pagina.
// ============================================================================

import { useActionState, useEffect, useState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { useActionRedirect } from '@/components/ui/useActionRedirect';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { Button } from '@/components/ui/Button';
import { fieldClasses, labelClasses, selectClasses } from '@/components/ui/field-styles';
import { crearCurso, crearPeriodoDesdeCurso, type CrearPeriodoDesdeCursoState } from './actions';

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

interface Texts {
  term: string;
  noTerm: string;
  createTermToggle: string;
  termCreated: (name: string) => string;
  codePlaceholder: string;
  titlePlaceholder: string;
  gradingScale: string;
  template: string;
  unassigned: string;
  submit: string;
  submitting: string;
  modalTitle: string;
  modalName: string;
  modalNamePlaceholder: string;
  modalStart: string;
  modalEnd: string;
  modalSubmit: string;
  modalSubmitting: string;
  modalCancel: string;
}

const INITIAL_TERM_STATE: CrearPeriodoDesdeCursoState = { error: null };

export function CursoForms({
  initialTerms,
  gradingScales,
  templates,
  tr,
}: {
  initialTerms: Term[];
  gradingScales: GradingScale[] | null;
  templates: CertificateTemplate[] | null;
  tr: Texts;
}) {
  const [terms, setTerms] = useState(initialTerms);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [createdTermName, setCreatedTermName] = useState<string | null>(null);
  // Rastrea el ULTIMO periodo ya incorporado a "terms" -- necesario para
  // ajustar el estado durante el render (ver mas abajo) en vez de un
  // useEffect: llamar setState sincrono dentro de un efecto dispara un
  // render en cascada evitable (ver "Adjusting state based on a prop
  // change" en la documentacion de React).
  const [lastAddedTermId, setLastAddedTermId] = useState<string | null>(null);

  const [courseState, courseFormAction, coursePending] = useActionState(crearCurso, INITIAL_ACTION_STATE);
  useActionRedirect(courseState);

  const [termState, termFormAction, termPending] = useActionState(crearPeriodoDesdeCurso, INITIAL_TERM_STATE);

  if (termState.term && termState.term.id !== lastAddedTermId) {
    const newTerm = termState.term;
    setLastAddedTermId(newTerm.id);
    setTerms((prev) => [...prev, newTerm]);
    setSelectedTermId(newTerm.id);
    setCreatedTermName(newTerm.name);
  }

  // El checkbox del popup (mismo patron CSS que "nav-toggle" en (app)/
  // layout.tsx) sigue siendo lo que lo abre/cierra -- este efecto SOLO toca
  // el DOM (destildarlo), sin llamar a setState, así que no dispara el
  // problema de arriba.
  useEffect(() => {
    if (termState.term) {
      const checkbox = document.getElementById('crear-periodo-toggle') as HTMLInputElement | null;
      if (checkbox) checkbox.checked = false;
    }
  }, [termState.term]);

  return (
    <>
      {courseState.error && (
        <div className="mb-6">
          <ErrorBanner message={courseState.error} />
        </div>
      )}
      {createdTermName && <SuccessBanner>{tr.termCreated(createdTermName)}</SuccessBanner>}

      {/* Checkbox del popup + el popup en si: hermanos entre si, AMBOS
         fuera del <form> del curso (form dentro de form es HTML invalido). */}
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
          {termState.error && (
            <div className="mb-3">
              <ErrorBanner message={termState.error} />
            </div>
          )}
          <form action={termFormAction} className="flex flex-col gap-3">
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
              <Button type="submit" size="sm" disabled={termPending}>
                {termPending ? tr.modalSubmitting : tr.modalSubmit}
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

      <form action={courseFormAction} className="flex max-w-sm flex-col gap-3">
        <label className={labelClasses} htmlFor="course-term">
          {tr.term}
          <select
            id="course-term"
            name="termId"
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
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
        <Button type="submit" className="self-start" disabled={coursePending}>
          {coursePending ? tr.submitting : tr.submit}
        </Button>
      </form>
    </>
  );
}
