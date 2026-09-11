'use client';

// ============================================================================
// PerfilForm.tsx — Client Component A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/éxito de
// actualizarPerfilDeAlumno sin que esta llame a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { Button } from '@/components/ui/Button';
import { actualizarPerfilDeAlumno, type PerfilActionState } from './actions';

const INITIAL_STATE: PerfilActionState = { error: null };

interface StaffEditableProfile {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
}

export function PerfilForm({
  userTenantId,
  profile,
  t,
}: {
  userTenantId: string;
  profile: StaffEditableProfile;
  t: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    department: string;
    province: string;
    district: string;
    saveChanges: string;
    saving: string;
    updated: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    actualizarPerfilDeAlumno.bind(null, userTenantId),
    INITIAL_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-6">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.saved && <SuccessBanner>{t.updated}</SuccessBanner>}

      <form action={formAction} className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-500">
          {t.firstName}
          <input
            name="firstName"
            type="text"
            maxLength={120}
            defaultValue={profile.firstName ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t.lastName}
          <input
            name="lastName"
            type="text"
            maxLength={120}
            defaultValue={profile.lastName ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t.phone}
          <input
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={profile.phone ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500 sm:col-span-2">
          {t.address}
          <input
            name="address"
            type="text"
            maxLength={300}
            defaultValue={profile.address ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t.department}
          <input
            name="department"
            type="text"
            maxLength={120}
            defaultValue={profile.department ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t.province}
          <input
            name="province"
            type="text"
            maxLength={120}
            defaultValue={profile.province ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t.district}
          <input
            name="district"
            type="text"
            maxLength={120}
            defaultValue={profile.district ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <Button type="submit" className="self-start sm:col-span-2" disabled={pending}>
          {pending ? t.saving : t.saveChanges}
        </Button>
      </form>
    </>
  );
}
