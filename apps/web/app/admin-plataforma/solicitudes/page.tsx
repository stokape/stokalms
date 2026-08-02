// ============================================================================
// admin-plataforma/solicitudes/page.tsx — Panel para APROBAR o RECHAZAR
// solicitudes de alta de instituciones nuevas.
//
// Vive FUERA del route group "(app)" (que es para pantallas de negocio DE
// un tenant, con su nav de Cursos/Matrículas/etc.) porque esto no es
// negocio de ningun tenant en particular — es administracion de toda la
// PLATAFORMA. Por eso tampoco usa "apiFetch" con el chequeo de permisos
// habitual: el backend la protege con PlatformAdminGuard (ver
// apps/api/src/auth/platform-admin.guard.ts), que compara el email de
// quien inicio sesion contra una lista fija (PLATFORM_ADMIN_EMAILS) — si
// no esta en la lista, el fetch de abajo va a fallar con 403 y esta
// pagina muestra el mismo ErrorBanner que cualquier otra pantalla sin
// permiso.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { aprobarSolicitud, rechazarSolicitud } from './actions';

interface TenantRegistrationRequest {
  id: string;
  institutionName: string;
  desiredSubdomain: string;
  contactName: string;
  contactEmail: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  rejectionReason: string | null;
}

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const token = await requireAccessToken();

  let requests: TenantRegistrationRequest[];
  try {
    requests = await apiFetch<TenantRegistrationRequest[]>(token, '/tenant-registration-requests');
  } catch (err) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorBanner message={toErrorMessage(err)} />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const reviewed = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Solicitudes de alta de instituciones</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      <h2 className="mb-3 text-lg font-medium">Pendientes</h2>
      {pending.length === 0 ? (
        <p className="mb-8 text-zinc-500">No hay solicitudes pendientes.</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {pending.map((r) => (
            <li key={r.id} className="py-4">
              <p className="font-medium">{r.institutionName}</p>
              <p className="text-sm text-zinc-500">
                Subdominio deseado: <span className="font-mono">{r.desiredSubdomain}</span>
              </p>
              <p className="text-sm text-zinc-500">
                Contacto: {r.contactName} — {r.contactEmail}
              </p>
              {r.message && <p className="mt-1 text-sm italic text-zinc-500">&quot;{r.message}&quot;</p>}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <form action={aprobarSolicitud.bind(null, r.id)}>
                  <button
                    type="submit"
                    className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                  >
                    Aprobar
                  </button>
                </form>
                <form
                  action={rechazarSolicitud.bind(null, r.id)}
                  className="flex items-center gap-2"
                >
                  <input
                    name="reason"
                    type="text"
                    placeholder="Motivo (opcional)"
                    className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <button type="submit" className="text-sm text-red-600 underline dark:text-red-400">
                    Rechazar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-medium">Ya revisadas</h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {reviewed.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <span className="font-medium">{r.institutionName}</span> —{' '}
                {r.status === 'approved' ? (
                  <span className="text-green-700 dark:text-green-400">Aprobada</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    Rechazada{r.rejectionReason ? ` (${r.rejectionReason})` : ''}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
