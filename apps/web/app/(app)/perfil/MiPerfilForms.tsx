'use client';

// ============================================================================
// MiPerfilForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/éxito de cada
// accion sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { fileInputClasses } from '@/components/ui/field-styles';
import { actualizarFoto, actualizarMiPerfil, type PerfilActionState } from './actions';

const INITIAL_STATE: PerfilActionState = { error: null };

export function ActualizarFotoForm({ uploadLabel, uploadingLabel }: { uploadLabel: string; uploadingLabel: string }) {
  const [state, formAction, pending] = useActionState(actualizarFoto, INITIAL_STATE);

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input name="file" type="file" accept="image/*" required className={fileInputClasses} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? uploadingLabel : uploadLabel}
        </Button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}

interface Profile {
  userTenantId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
  enrolledAt: string;
}

export function ActualizarMiPerfilForm({
  profile,
  enrolledAtFormatted,
  t,
}: {
  profile: Profile;
  enrolledAtFormatted: string;
  t: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    department: string;
    province: string;
    district: string;
    enrolledOn: string;
    saveChanges: string;
    saving: string;
    updated: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    actualizarMiPerfil.bind(null, profile.userTenantId),
    INITIAL_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-4">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.saved && <SuccessBanner>{t.updated}</SuccessBanner>}

      <form action={formAction} className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t.firstName} name="firstName" maxLength={120} defaultValue={profile.firstName ?? ''} />
        <Field label={t.lastName} name="lastName" maxLength={120} defaultValue={profile.lastName ?? ''} />
        <div>
          <dt className="text-xs text-muted">{t.email}</dt>
          <dd className="mt-0.5">{profile.email}</dd>
        </div>
        <Field label={t.phone} name="phone" type="tel" maxLength={30} defaultValue={profile.phone ?? ''} />
        <Field
          label={t.address}
          name="address"
          maxLength={300}
          defaultValue={profile.address ?? ''}
          className="sm:col-span-2"
        />
        <Field label={t.department} name="department" maxLength={120} defaultValue={profile.department ?? ''} />
        <Field label={t.province} name="province" maxLength={120} defaultValue={profile.province ?? ''} />
        <Field label={t.district} name="district" maxLength={120} defaultValue={profile.district ?? ''} />
        <div>
          <dt className="text-xs text-muted">{t.enrolledOn}</dt>
          <dd className="mt-0.5">{enrolledAtFormatted}</dd>
        </div>
        <Button type="submit" className="self-start sm:col-span-2" disabled={pending}>
          {pending ? t.saving : t.saveChanges}
        </Button>
      </form>
    </>
  );
}
