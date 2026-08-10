// ============================================================================
// dominios/page.tsx — Dominio propio de TU institución (ej.
// campus.institutosanmartin.edu.pe), además del subdominio automático
// (...stokalms.com) con el que ya se puede entrar. Requiere "tenant:edit"
// (Super Admin / Administrador de entidad, ver prisma/seed.js) — igual que
// Configuración de marca; cualquier otro rol ve el mensaje de "no tienes
// permiso" habitual. Ver la nota extensa en
// apps/api/src/modules/tenant-domain/tenant-domain.service.ts.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fieldClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import { agregarDominio, verificarDominio, eliminarDominio } from './actions';

const TEXT = {
  es: {
    title: 'Dominios',
    description: (
      <>
        Tu institución ya entra por su subdominio automático (<code>...stokalms.com</code>) — aquí puedes
        agregar además un dominio 100% propio (ej. <code>campus.institutosanmartin.edu.pe</code>). Antes
        de activarlo hay que comprobar que de verdad lo controlas, publicando el registro TXT que se
        muestra abajo.
      </>
    ),
    done: 'Listo.',
    primary: 'Principal',
    verified: 'Verificado',
    unverified: 'Sin verificar',
    txtHelp: 'Para activarlo, quien administra el DNS de este dominio tiene que crear un registro TXT:',
    name: 'Nombre',
    value: 'Valor',
    verifyNow: 'Verificar ahora',
    delete: 'Eliminar',
    placeholder: 'campus.institutosanmartin.edu.pe',
    addDomain: 'Agregar dominio',
  },
  en: {
    title: 'Domains',
    description: (
      <>
        Your institution can already be reached through its automatic subdomain (<code>...stokalms.com</code>)
        — here you can also add a domain that&apos;s 100% your own (e.g. <code>campus.institutosanmartin.edu.pe</code>).
        Before activating it, you need to prove you actually control it by publishing the TXT record shown
        below.
      </>
    ),
    done: 'Done.',
    primary: 'Primary',
    verified: 'Verified',
    unverified: 'Unverified',
    txtHelp: "To activate it, whoever manages this domain's DNS needs to create a TXT record:",
    name: 'Name',
    value: 'Value',
    verifyNow: 'Verify now',
    delete: 'Delete',
    placeholder: 'campus.institutosanmartin.edu.pe',
    addDomain: 'Add domain',
  },
};

interface TenantDomainRow {
  id: string;
  domain: string;
  isPrimary: boolean;
  verified: boolean;
  verificationToken: string | null;
}

export default async function DominiosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let domains: TenantDomainRow[];
  try {
    domains = await apiFetch<TenantDomainRow[]>(token, '/tenant/domains');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t.title} description={t.description} />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {saved && (
        <Card className="mb-6 border-success/30 bg-success-bg text-sm text-success">{t.done}</Card>
      )}

      <Card>
        {domains.length > 0 && (
          <ul className="mb-4 divide-y divide-border">
            {domains.map((d) => {
              // El registro TXT es siempre reconstruible a partir del
              // dominio + el token (ver tenant-domain.service.ts) — no
              // hace falta que el backend lo mande armado, alcanza con
              // aplicar el mismo formato aca.
              const txtRecordName = `_stoka-verify.${d.domain}`;
              const txtRecordValue = d.verificationToken
                ? `stoka-verify=${d.verificationToken}`
                : null;

              return (
                <li key={d.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{d.domain}</span>
                    {d.isPrimary && <Badge tone="info">{t.primary}</Badge>}
                    {d.verified ? (
                      <Badge tone="success">{t.verified}</Badge>
                    ) : (
                      <Badge tone="warning">{t.unverified}</Badge>
                    )}
                  </div>

                  {!d.verified && txtRecordValue && (
                    <div className="mt-2 rounded-lg border border-dashed border-border bg-black/[.02] p-3 text-xs dark:bg-white/[.03]">
                      <p className="mb-1 text-muted">{t.txtHelp}</p>
                      <p className="font-mono">{t.name}: {txtRecordName}</p>
                      <p className="break-all font-mono">{t.value}: {txtRecordValue}</p>
                    </div>
                  )}

                  <div className="mt-2 flex gap-4">
                    {!d.verified && (
                      <form action={verificarDominio.bind(null, d.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {t.verifyNow}
                        </button>
                      </form>
                    )}
                    {!d.isPrimary && (
                      <form action={eliminarDominio.bind(null, d.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-danger hover:underline"
                        >
                          {t.delete}
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form action={agregarDominio} className="flex flex-wrap items-center gap-2">
          <input
            name="domain"
            type="text"
            required
            placeholder={t.placeholder}
            className={`max-w-xs ${fieldClasses}`}
          />
          <Button type="submit" variant="secondary" size="sm">
            {t.addDomain}
          </Button>
        </form>
      </Card>
    </div>
  );
}
