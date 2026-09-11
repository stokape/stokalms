'use client';

// ============================================================================
// MantenimientoForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/éxito de cada
// accion sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { fieldClasses, labelClasses, fileInputClasses } from '@/components/ui/field-styles';
import {
  guardarMantenimiento,
  subirImagenMantenimiento,
  quitarImagenMantenimiento,
  type MantenimientoActionState,
} from './actions';

const INITIAL_STATE: MantenimientoActionState = { error: null };

export function GuardarMantenimientoForm({
  maintenanceMode,
  maintenanceMessage,
  maintenanceEndsAtValue,
  t,
}: {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceEndsAtValue: string;
  t: {
    done: string;
    enable: string;
    enableHelp: string;
    messageLabel: string;
    messagePlaceholder: string;
    endsAtLabel: string;
    endsAtHelp: string;
    save: string;
    saving: string;
  };
}) {
  const [state, formAction, pending] = useActionState(guardarMantenimiento, INITIAL_STATE);

  return (
    <Card>
      {state.error && (
        <div className="mb-4">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.saved && (
        <div className="mb-4">
          <SuccessBanner>{t.done}</SuccessBanner>
        </div>
      )}
      <form action={formAction} className="space-y-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="maintenanceMode"
            defaultChecked={maintenanceMode}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm">
            <span className="font-medium">{t.enable}</span>
            <span className="block text-xs text-muted">{t.enableHelp}</span>
          </span>
        </label>

        <div>
          <label className={labelClasses} htmlFor="maintenanceMessage">
            {t.messageLabel}
          </label>
          <textarea
            id="maintenanceMessage"
            name="maintenanceMessage"
            rows={3}
            maxLength={500}
            placeholder={t.messagePlaceholder}
            defaultValue={maintenanceMessage}
            className={fieldClasses}
          />
        </div>

        <div>
          <label className={labelClasses} htmlFor="maintenanceEndsAt">
            {t.endsAtLabel}
          </label>
          <input
            id="maintenanceEndsAt"
            name="maintenanceEndsAt"
            type="datetime-local"
            defaultValue={maintenanceEndsAtValue}
            className={`max-w-xs ${fieldClasses}`}
          />
          <p className="mt-1 text-xs text-muted">{t.endsAtHelp}</p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? t.saving : t.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function QuitarImagenButton({ confirmMessage, label }: { confirmMessage: string; label: string }) {
  const [state, formAction, pending] = useActionState(quitarImagenMantenimiento, INITIAL_STATE);

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <button type="submit" disabled={pending} className="text-xs font-medium text-danger hover:underline">
          {label}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function SubirImagenForm({ submitLabel, submittingLabel }: { submitLabel: string; submittingLabel: string }) {
  const [state, formAction, pending] = useActionState(subirImagenMantenimiento, INITIAL_STATE);

  return (
    <div>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input type="file" name="file" accept="image/*" required className={fileInputClasses} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </div>
  );
}
