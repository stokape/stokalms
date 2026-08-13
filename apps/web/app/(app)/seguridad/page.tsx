// ============================================================================
// seguridad/page.tsx — "Seguridad avanzada" (plan Enterprise, ver
// lib/pricing.ts): exigir 2FA vía Keycloak + registro de auditoría. Ambas
// piezas exigen "tenant:edit"/"audit:view" (Super Admin/Administrador de
// entidad, ver prisma/seed.js) — la misma audiencia en la práctica, pero
// cada sección chequea SU propio permiso por separado (ver
// security.controller.ts), no una sola bandera "es admin".
// ============================================================================

import { requireAccessToken, apiFetch, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getLocale } from '@/lib/locale';
import { guardarSeguridad } from './actions';

const TEXT = {
  es: {
    title: 'Seguridad',
    description: 'Exigir segundo factor de inicio de sesión y consultar quién hizo qué.',
    done: 'Listo.',
    appliedTo: (n: number, pending: number) =>
      `Se aplicó a ${n} cuenta(s) ya existente(s)${pending > 0 ? ` (${pending} todavía no tienen cuenta de Keycloak — les tocará configurarlo en cuanto inicien sesión por primera vez).` : '.'}`,
    require2FATitle: 'Exigir segundo factor (2FA)',
    require2FAHelp:
      'La próxima vez que cada persona inicie sesión, Keycloak le va a pedir configurar una app de autenticación (Google Authenticator, Authy, etc.) antes de dejarla entrar. Se aplica a quienes YA son miembros hoy — alguien que se una después no lo tiene automáticamente todavía.',
    save: 'Guardar',
    limitationNote:
      'No incluye políticas de contraseña o de expiración de sesión personalizadas por institución: hoy todas las instituciones comparten el mismo servidor de identidad (Keycloak) — eso requeriría un cambio de arquitectura más grande (un "realm" separado por institución), no solo un interruptor más.',
    auditTitle: 'Registro de auditoría',
    auditDescription: 'Cambios de roles, marca, certificados y matrículas — quién hizo qué y cuándo.',
    auditExport: 'Exportar CSV ↓',
    auditWhen: 'Fecha',
    auditWho: 'Quién',
    auditAction: 'Acción',
    auditDetail: 'Detalle',
    auditEmpty: 'Todavía no hay eventos registrados.',
    system: '(sistema)',
    noPermission: 'No tienes permiso para ver esta pantalla.',
  },
  en: {
    title: 'Security',
    description: 'Require a second sign-in factor and see who did what.',
    done: 'Done.',
    appliedTo: (n: number, pending: number) =>
      `Applied to ${n} existing account(s)${pending > 0 ? ` (${pending} don't have a Keycloak account yet — it'll apply the first time they sign in).` : '.'}`,
    require2FATitle: 'Require a second factor (2FA)',
    require2FAHelp:
      "Next time each person signs in, Keycloak will ask them to set up an authenticator app (Google Authenticator, Authy, etc.) before letting them in. Applies to today's members — someone who joins later doesn't get it automatically yet.",
    save: 'Save',
    limitationNote:
      "Doesn't include per-institution password or session-expiration policies: today every institution shares the same identity server (Keycloak) — that would need a bigger architecture change (a separate \"realm\" per institution), not just another switch.",
    auditTitle: 'Audit log',
    auditDescription: 'Role, branding, certificate, and enrollment changes — who did what and when.',
    auditExport: 'Export CSV ↓',
    auditWhen: 'Date',
    auditWho: 'Who',
    auditAction: 'Action',
    auditDetail: 'Detail',
    auditEmpty: 'No events recorded yet.',
    system: '(system)',
    noPermission: "You don't have permission to view this screen.",
  },
};

interface SecuritySettings {
  require2FA: boolean;
}

interface AuditLogRow {
  id: string;
  createdAt: string;
  action: string;
  payload: unknown;
  userEmail: string | null;
  userFullName: string | null;
}

export default async function SeguridadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; appliedTo?: string; pending?: string }>;
}) {
  const { error, saved, appliedTo, pending } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];
  const permissions = await getPermissions(token);
  const canEditSettings = can(permissions, 'tenant', 'edit');
  const canViewAudit = can(permissions, 'audit', 'view');
  const canExportAudit = can(permissions, 'audit', 'export');

  let settings: SecuritySettings | null = null;
  if (canEditSettings) {
    try {
      settings = await apiFetch<SecuritySettings>(token, '/security/settings');
    } catch {
      settings = null;
    }
  }

  let auditLogs: AuditLogRow[] | null = null;
  if (canViewAudit) {
    try {
      auditLogs = await apiFetch<AuditLogRow[]>(token, '/security/audit-logs');
    } catch {
      auditLogs = null;
    }
  }

  if (!canEditSettings && !canViewAudit) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.title} />
        <ErrorBanner message={t.noPermission} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.title} description={t.description} />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {saved && (
        <SuccessBanner>
          <p>{t.done}</p>
          {appliedTo !== undefined && <p className="mt-1">{t.appliedTo(Number(appliedTo), Number(pending ?? 0))}</p>}
        </SuccessBanner>
      )}

      {canEditSettings && settings && (
        <Card className="mb-8">
          <form action={guardarSeguridad} className="flex flex-col gap-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="require2FA"
                defaultChecked={settings.require2FA}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              />
              <span className="text-sm">
                <span className="font-medium">{t.require2FATitle}</span>
                <span className="block text-xs text-muted">{t.require2FAHelp}</span>
              </span>
            </label>
            <p className="rounded-lg bg-black/[.02] p-3 text-xs text-muted dark:bg-white/[.04]">{t.limitationNote}</p>
            <div className="flex justify-end">
              <Button type="submit">{t.save}</Button>
            </div>
          </form>
        </Card>
      )}

      {canViewAudit && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-medium">{t.auditTitle}</h2>
              <p className="text-sm text-muted">{t.auditDescription}</p>
            </div>
            {canExportAudit && (
              <a href="/seguridad/auditoria/export" className="text-sm font-medium text-primary hover:underline">
                {t.auditExport}
              </a>
            )}
          </div>
          <Card>
            {!auditLogs || auditLogs.length === 0 ? (
              <p className="text-sm text-muted">{t.auditEmpty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[t.auditWhen, t.auditWho, t.auditAction, t.auditDetail].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border last:border-b-0 align-top">
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-muted">
                          {new Date(log.createdAt).toLocaleString('es-PE')}
                        </td>
                        <td className="px-3 py-2">{log.userEmail ?? t.system}</td>
                        <td className="px-3 py-2 font-mono text-xs">{log.action}</td>
                        <td className="max-w-xs truncate px-3 py-2 font-mono text-xs text-muted" title={JSON.stringify(log.payload)}>
                          {JSON.stringify(log.payload)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
