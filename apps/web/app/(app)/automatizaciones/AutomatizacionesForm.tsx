'use client';

// ============================================================================
// AutomatizacionesForm.tsx — Client Component A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/éxito de
// guardarAutomatizaciones sin que esta llame a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { guardarAutomatizaciones, type AutomatizacionesActionState } from './actions';

const INITIAL_STATE: AutomatizacionesActionState = { error: null };

interface AutomationSettings {
  autoIssueCertificate: boolean;
  dueDateReminders: boolean;
  inactivityAlerts: boolean;
  atRiskWeeklyDigest: boolean;
}

export function AutomatizacionesForm({
  settings,
  t,
}: {
  settings: AutomationSettings;
  t: {
    done: string;
    certTitle: string;
    certHelp: string;
    reminderTitle: string;
    reminderHelp: string;
    reminderNote: string;
    inactivityTitle: string;
    inactivityHelp: string;
    digestTitle: string;
    digestHelp: string;
    save: string;
    saving: string;
  };
}) {
  const [state, formAction, pending] = useActionState(guardarAutomatizaciones, INITIAL_STATE);

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
      <form action={formAction} className="flex flex-col gap-6">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="autoIssueCertificate"
            defaultChecked={settings.autoIssueCertificate}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm">
            <span className="font-medium">{t.certTitle}</span>
            <span className="block text-xs text-muted">{t.certHelp}</span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="dueDateReminders"
            defaultChecked={settings.dueDateReminders}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm">
            <span className="font-medium">{t.reminderTitle}</span>
            <span className="block text-xs text-muted">{t.reminderHelp}</span>
            <span className="mt-1 block text-xs text-warning">{t.reminderNote}</span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="inactivityAlerts"
            defaultChecked={settings.inactivityAlerts}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm">
            <span className="font-medium">{t.inactivityTitle}</span>
            <span className="block text-xs text-muted">{t.inactivityHelp}</span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="atRiskWeeklyDigest"
            defaultChecked={settings.atRiskWeeklyDigest}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm">
            <span className="font-medium">{t.digestTitle}</span>
            <span className="block text-xs text-muted">{t.digestHelp}</span>
          </span>
        </label>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? t.saving : t.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
