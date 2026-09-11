'use client';

// ============================================================================
// useActionRedirect.ts — Client Component A PROPOSITO (ver periodos/
// PeriodosForms.tsx): navega con router.push() cuando una Server Action con
// ActionState (ver lib/action-state.ts) termina con "redirectTo" -- esto es
// lo que reemplaza al redirect() que antes se llamaba DENTRO de la Server
// Action (rompia headers()/cookies() en el re-render post-redirect, ver la
// nota extensa en periodos/actions.ts). router.push() del lado del cliente
// es un request real y separado del navegador, no tiene ese problema.
// ============================================================================

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';

export function useActionRedirect(state: ActionState) {
  const router = useRouter();

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
    }
    // Solo "redirectTo": no queremos re-disparar esto si "error" cambia solo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.redirectTo]);
}
