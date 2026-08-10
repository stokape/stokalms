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

import { headers } from 'next/headers';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { fieldClasses } from '@/components/ui/field-styles';
import { readTempCredentialsCookie } from '../temp-credentials';
import { TempCredentialsBanner } from '../TempCredentialsBanner';
import { getLocale } from '@/lib/locale';
import { aprobarSolicitud, rechazarSolicitud } from './actions';

const TEXT = {
  es: {
    title: 'Solicitudes de alta de instituciones',
    createDirect: 'Crear institución directamente',
    pending: 'Pendientes',
    noPending: 'No hay solicitudes pendientes.',
    desiredSubdomain: 'Subdominio deseado',
    contact: 'Contacto',
    approve: 'Aprobar',
    reasonPlaceholder: 'Motivo (opcional)',
    reject: 'Rechazar',
    reviewed: 'Ya revisadas',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    goToInstitution: 'Ir a la institución ↗',
  },
  en: {
    title: 'Institution registration requests',
    createDirect: 'Create institution directly',
    pending: 'Pending',
    noPending: 'No pending requests.',
    desiredSubdomain: 'Desired subdomain',
    contact: 'Contact',
    approve: 'Approve',
    reasonPlaceholder: 'Reason (optional)',
    reject: 'Reject',
    reviewed: 'Already reviewed',
    approved: 'Approved',
    rejected: 'Rejected',
    goToInstitution: 'Go to institution ↗',
  },
};

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
  const [{ error }, tempCredentials, hostHeader] = await Promise.all([
    searchParams,
    readTempCredentialsCookie(),
    headers().then((h) => h.get('host') ?? ''),
  ]);
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];
  // Para armar el link a CADA institución aprobada (subdominio propio —
  // ver PLATFORM_ROOT_DOMAIN, tenant-registration.service.ts "buildDomain").
  // No hay forma de saber si el servidor real corre bajo https (producción)
  // o http (desarrollo local) más que por esto — mismo criterio que
  // entrar/page.tsx y registro-institucion/page.tsx.
  const [rootHostname, port] = hostHeader.split(':');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  let requests: TenantRegistrationRequest[];
  try {
    requests = await apiFetch<TenantRegistrationRequest[]>(token, '/tenant-registration-requests');
  } catch (err) {
    return (
      <div className="mx-auto max-w-3xl px-6">
        <ErrorBanner message={toErrorMessage(err)} />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const reviewed = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="mx-auto max-w-3xl px-6">
      <PageHeader
        title={t.title}
        actions={
          <LinkButton href="/admin-plataforma/instituciones/nueva" variant="secondary" size="sm">
            {t.createDirect}
          </LinkButton>
        }
      />

      {tempCredentials && (
        <div className="mb-6">
          <TempCredentialsBanner credentials={tempCredentials} />
        </div>
      )}

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      <h2 className="mb-3 text-base font-medium">{t.pending}</h2>
      {pending.length === 0 ? (
        <p className="mb-8 text-sm text-muted">{t.noPending}</p>
      ) : (
        <div className="mb-8 flex flex-col gap-3">
          {pending.map((r) => (
            <Card key={r.id}>
              <p className="font-medium">{r.institutionName}</p>
              <p className="text-sm text-muted">
                {t.desiredSubdomain}: <span className="font-mono">{r.desiredSubdomain}</span>
              </p>
              <p className="text-sm text-muted">
                {t.contact}: {r.contactName} — {r.contactEmail}
              </p>
              {r.message && <p className="mt-1 text-sm italic text-muted">&quot;{r.message}&quot;</p>}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <form action={aprobarSolicitud.bind(null, r.id)}>
                  <Button type="submit" size="sm">
                    {t.approve}
                  </Button>
                </form>
                <form
                  action={rechazarSolicitud.bind(null, r.id)}
                  className="flex items-center gap-2"
                >
                  <input
                    name="reason"
                    type="text"
                    placeholder={t.reasonPlaceholder}
                    className={`${fieldClasses} py-1.5 text-sm`}
                  />
                  <button type="submit" className="text-sm font-medium text-danger hover:underline">
                    {t.reject}
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 className="mb-3 text-base font-medium">{t.reviewed}</h2>
          <Card>
            <ul className="divide-y divide-border">
              {reviewed.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.institutionName}</span>
                    {r.status === 'approved' ? (
                      <Badge tone="success">{t.approved}</Badge>
                    ) : (
                      <Badge tone="danger">
                        {t.rejected}{r.rejectionReason ? ` (${r.rejectionReason})` : ''}
                      </Badge>
                    )}
                  </div>
                  {/* <a> comun a proposito, no next/link: es un subdominio
                     DISTINTO (otro origen), mismo criterio que
                     entrar/page.tsx — ver la nota grande ahi sobre CSP
                     "form-action" y por que esto ni siquiera aplica (no es
                     un form). Solo instituciones APROBADAS tienen dominio
                     real; una rechazada nunca llegó a crear un Tenant.
                     target="_blank": este panel es un espacio de trabajo
                     propio (ver "Cerrar sesión" en el encabezado) — abrir
                     cada institución en pestaña nueva evita perder el
                     lugar en la lista al volver. "noopener noreferrer":
                     la pestaña nueva no debe poder tocar esta (via
                     "window.opener"), buena práctica siempre que se abre
                     un link cruzando de origen. */}
                  {r.status === 'approved' && (
                    <a
                      href={`${protocol}://${r.desiredSubdomain}.${rootHostname}${port ? `:${port}` : ''}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t.goToInstitution}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
