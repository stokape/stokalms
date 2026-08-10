// ============================================================================
// TempCredentialsBanner.tsx — Muestra el resultado de crear/aprobar una
// institución (ver temp-credentials.ts): el dominio nuevo, y la contraseña
// temporal de Keycloak SI se generó una (o, si no, por qué no — ver
// keycloak-admin.service.ts, "alreadyExisted" vs. un fallo real).
// ============================================================================

import type { TempCredentials } from './temp-credentials';
import { getLocale } from '@/lib/locale';

const TEXT = {
  es: {
    createdIn: 'Institución creada en',
    tempPassword: 'Contraseña temporal — anótala ahora, no se vuelve a mostrar',
    shareHelp: 'Pásasela a la persona de contacto por un canal seguro (no por aquí — no hay envío de correo configurado todavía). Va a tener que cambiarla en su primer inicio de sesión.',
  },
  en: {
    createdIn: 'Institution created at',
    tempPassword: "Temporary password — write it down now, it won't be shown again",
    shareHelp: "Share it with the contact person through a secure channel (not here — email sending isn't set up yet). They'll have to change it on their first login.",
  },
};

export async function TempCredentialsBanner({ credentials }: { credentials: TempCredentials }) {
  const t = TEXT[await getLocale()];
  return (
    <div className="mb-6 rounded-xl border border-border bg-surface px-4 py-4 text-sm">
      <p className="font-medium text-foreground">
        {t.createdIn} <span className="font-mono text-primary">{credentials.domain}</span>
      </p>
      {credentials.temporaryPassword ? (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-warning">
            {t.tempPassword}
          </p>
          <p className="mt-1 select-all rounded-lg border border-border bg-black/[.03] px-3 py-2 font-mono text-base text-foreground dark:bg-white/[.06]">
            {credentials.temporaryPassword}
          </p>
          <p className="mt-2 text-xs text-muted">{t.shareHelp}</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">{credentials.keycloakWarning}</p>
      )}
    </div>
  );
}
