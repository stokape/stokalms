'use client';

// ============================================================================
// PeriodosForms.tsx — Client Components A PROPOSITO (mismo criterio que
// ConfirmSubmitButton.tsx/BrandingStudio.tsx): "useActionState" necesita
// ejecutarse en el cliente para poder mostrar el error de la Server Action
// SIN que esta llame a redirect() -- ver la nota extensa en actions.ts
// sobre por que evitar redirect() aca es necesario, no un capricho.
// ============================================================================

import { useActionState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fieldClasses } from '@/components/ui/field-styles';
import { ErrorBanner } from '@/components/ErrorBanner';
import { eliminarPeriodo, crearPeriodo, type PeriodoActionState } from './actions';

const INITIAL_STATE: PeriodoActionState = { error: null };

export function EliminarPeriodoButton({ termId, termName }: { termId: string; termName: string }) {
  const [state, formAction, pending] = useActionState(eliminarPeriodo.bind(null, termId), INITIAL_STATE);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`¿Eliminar el periodo "${termName}"? Esto solo funciona si ningún curso lo usa todavía.`)) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? 'Eliminando…' : 'Eliminar'}
      </Button>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </form>
  );
}

export function CrearPeriodoForm() {
  const [state, formAction, pending] = useActionState(crearPeriodo, INITIAL_STATE);

  return (
    <Card>
      <h2 className="mb-3 text-base font-medium">Crear un periodo nuevo</h2>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex max-w-sm flex-col gap-3">
        <input
          name="name"
          type="text"
          required
          maxLength={120}
          placeholder='Ej. "2026 - Semestre I"'
          className={fieldClasses}
        />
        <label className="text-xs text-muted">
          Fecha de inicio
          <input name="startDate" type="date" required className={`mt-1 ${fieldClasses}`} />
        </label>
        <label className="text-xs text-muted">
          Fecha de fin
          <input name="endDate" type="date" required className={`mt-1 ${fieldClasses}`} />
        </label>
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? 'Creando…' : 'Crear periodo'}
        </Button>
      </form>
    </Card>
  );
}
