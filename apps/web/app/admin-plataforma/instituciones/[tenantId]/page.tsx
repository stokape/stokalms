// ============================================================================
// admin-plataforma/instituciones/[tenantId]/page.tsx — Detalle de UNA
// institucion desde el panel de plataforma: activar/desactivar, dominios
// (mismo flujo TXT que (app)/dominios/page.tsx) y miembros/roles (mismo
// flujo que (app)/usuarios/page.tsx), pero apuntando a CUALQUIER tenant por
// id, no al "tenant activo del request" — ver la nota extensa en
// platform-tenants.service.ts (backend).
//
// A diferencia de (app)/usuarios/page.tsx, aca NO se ofrece acotar un rol a
// un curso especifico: eso exigiria otro endpoint cross-tenant solo para
// listar cursos de una institucion ajena, y no es parte de lo que se pidio
// (activar/desactivar, dominios, roles) — se puede agregar despues si hace
// falta.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { fieldClasses, labelClasses, fileInputClasses, selectClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import {
  cambiarEstadoInstitucion,
  cambiarPlanInstitucion,
  agregarDominio,
  verificarDominio,
  eliminarDominio,
  asignarRol,
  quitarRol,
  actualizarMarcaInstitucion,
  subirLogoInstitucion,
  subirFondoInstitucion,
  subirFaviconInstitucion,
  guardarMantenimientoInstitucion,
  subirImagenMantenimientoInstitucion,
  quitarImagenMantenimientoInstitucion,
} from './actions';

const TEXT = {
  es: {
    back: '← Instituciones',
    active: 'Activa',
    inactive: 'Desactivada',
    deactivate: 'Desactivar institución',
    activate: 'Activar institución',
    deactivateWarning:
      'Al desactivarla, nadie de esta institución (ni siquiera su Super Admin) va a poder iniciar sesión ni usar la plataforma hasta que se reactive.',
    brandTitle: 'Marca',
    institutionName: 'Nombre de la institución',
    primaryColor: 'Color de marca (botones y enlaces)',
    backgroundColor: 'Color de fondo (respaldo)',
    colorPickerTitle: 'Elegir color',
    saveNameAndColor: 'Guardar nombre y colores',
    logo: 'Logo',
    uploadLogo: 'Subir logo',
    favicon: 'Favicon',
    uploadFavicon: 'Subir favicon',
    backgroundImage: 'Imagen de fondo',
    uploadBackground: 'Subir imagen de fondo',
    domainsTitle: 'Dominios',
    done: 'Listo.',
    primary: 'Principal',
    verified: 'Verificado',
    unverified: 'Sin verificar',
    txtHelp: 'Para activarlo, quien administra el DNS de este dominio tiene que crear un registro TXT:',
    name: 'Nombre',
    value: 'Valor',
    verifyNow: 'Verificar ahora',
    delete: 'Eliminar',
    deleteConfirm: (domain: string) => `¿Eliminar el dominio "${domain}"?`,
    placeholder: 'campus.institutosanmartin.edu.pe',
    addDomain: 'Agregar dominio',
    maintenanceTitle: 'Mantenimiento',
    maintenanceActive: 'Activo',
    maintenanceOff: 'Apagado',
    enableMaintenance: 'Activar modo mantenimiento',
    enableMaintenanceHelp: 'Reemplaza el home público de esta institución y bloquea el resto de su app para todos sus roles.',
    messageLabel: 'Mensaje para quien visite la plataforma',
    messagePlaceholder: 'Estamos haciendo tareas de mantenimiento. Volvemos en un rato.',
    endsAtLabel: 'Vuelve aproximadamente a las (opcional)',
    save: 'Guardar',
    maintenanceImage: 'Imagen de fondo del aviso (opcional)',
    removeImage: 'Quitar imagen',
    removeImageConfirm: '¿Quitar esta imagen?',
    replace: 'Reemplazar',
    uploadImage: 'Subir imagen',
    membersTitle: 'Miembros y roles',
    noMembers: 'Todavía nadie se unió a esta institución.',
    person: 'Persona',
    roles: 'Roles',
    noRole: 'Sin rol asignado',
    status: 'Estado',
    remove: 'Quitar',
    removeConfirm: (role: string, name: string) => `¿Quitarle el rol "${role}" a ${name}?`,
    assignRole: 'Asignar rol',
    deactivateConfirm:
      'Al desactivarla, nadie de esta institución (ni siquiera su Super Admin) va a poder iniciar sesión hasta que se reactive. ¿Continuar?',
    planTitle: 'Plan',
    planHelp: 'Solo un Administrador de plataforma puede cambiar el plan de una institución.',
    planStarter: 'Starter',
    planBusiness: 'Business',
    planPro: 'Pro',
    planEnterprise: 'Enterprise',
    savePlan: 'Guardar plan',
  },
  en: {
    back: '← Institutions',
    active: 'Active',
    inactive: 'Deactivated',
    deactivate: 'Deactivate institution',
    activate: 'Activate institution',
    deactivateWarning:
      'Once deactivated, no one at this institution (not even its Super Admin) will be able to log in or use the platform until it is reactivated.',
    brandTitle: 'Branding',
    institutionName: 'Institution name',
    primaryColor: 'Brand color (buttons and links)',
    backgroundColor: 'Background color (fallback)',
    colorPickerTitle: 'Choose a color',
    saveNameAndColor: 'Save name and colors',
    logo: 'Logo',
    uploadLogo: 'Upload logo',
    favicon: 'Favicon',
    uploadFavicon: 'Upload favicon',
    backgroundImage: 'Background image',
    uploadBackground: 'Upload background image',
    domainsTitle: 'Domains',
    done: 'Done.',
    primary: 'Primary',
    verified: 'Verified',
    unverified: 'Unverified',
    txtHelp: "To activate it, whoever manages this domain's DNS needs to create a TXT record:",
    name: 'Name',
    value: 'Value',
    verifyNow: 'Verify now',
    delete: 'Delete',
    deleteConfirm: (domain: string) => `Delete the "${domain}" domain?`,
    placeholder: 'campus.institutosanmartin.edu.pe',
    addDomain: 'Add domain',
    maintenanceTitle: 'Maintenance',
    maintenanceActive: 'Active',
    maintenanceOff: 'Off',
    enableMaintenance: 'Enable maintenance mode',
    enableMaintenanceHelp: "Replaces this institution's public home page and locks the rest of its app for all of its roles.",
    messageLabel: 'Message for anyone who visits the platform',
    messagePlaceholder: "We're doing maintenance work. Back shortly.",
    endsAtLabel: 'Back around (optional)',
    save: 'Save',
    maintenanceImage: 'Notice background image (optional)',
    removeImage: 'Remove image',
    removeImageConfirm: 'Remove this image?',
    replace: 'Replace',
    uploadImage: 'Upload image',
    membersTitle: 'Members and roles',
    noMembers: 'No one has joined this institution yet.',
    person: 'Person',
    roles: 'Roles',
    noRole: 'No role assigned',
    status: 'Status',
    remove: 'Remove',
    removeConfirm: (role: string, name: string) => `Remove the "${role}" role from ${name}?`,
    assignRole: 'Assign role',
    deactivateConfirm:
      "Once deactivated, no one at this institution (not even its Super Admin) will be able to log in until it's reactivated. Continue?",
    planTitle: 'Plan',
    planHelp: 'Only a Platform Administrator can change an institution\'s plan.',
    planStarter: 'Starter',
    planBusiness: 'Business',
    planPro: 'Pro',
    planEnterprise: 'Enterprise',
    savePlan: 'Save plan',
  },
};

interface TenantSummary {
  id: string;
  name: string;
  active: boolean;
  plan: string;
}

interface TenantDomainRow {
  id: string;
  domain: string;
  isPrimary: boolean;
  verified: boolean;
  verificationToken: string | null;
}

interface RoleAssignment {
  userRoleId: string;
  roleId: string;
  roleName: string;
  scopeCourseId: string | null;
  scopeCourseTitle: string | null;
}

interface Member {
  userTenantId: string;
  email: string;
  fullName: string;
  status: string;
  roles: RoleAssignment[];
}

interface Role {
  id: string;
  name: string;
}

interface TenantBranding {
  name: string;
  branding: {
    logoUrl?: string;
    backgroundColor?: string;
    backgroundImageUrl?: string;
    primaryColor?: string;
    faviconUrl?: string;
  };
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  maintenanceEndsAt: string | null;
  maintenanceImageUrl?: string;
}

// El backend guarda maintenanceEndsAt en UTC — un <input type="datetime-local">
// necesita "YYYY-MM-DDTHH:mm" en hora LOCAL para mostrar de vuelta lo
// tipeado sin desfasarse por el huso horario en cada recarga (mismo
// helper que (app)/mantenimiento/page.tsx).
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function InstitucionDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { tenantId } = await params;
  const { error, saved } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let tenants: TenantSummary[];
  let domains: TenantDomainRow[];
  let members: Member[];
  let roles: Role[];
  let branding: TenantBranding;
  try {
    [tenants, domains, members, roles, branding] = await Promise.all([
      apiFetch<TenantSummary[]>(token, '/platform/tenants'),
      apiFetch<TenantDomainRow[]>(token, `/platform/tenants/${tenantId}/domains`),
      apiFetch<Member[]>(token, `/platform/tenants/${tenantId}/members`),
      apiFetch<Role[]>(token, `/platform/tenants/${tenantId}/roles`),
      apiFetch<TenantBranding>(token, `/platform/tenants/${tenantId}/branding`),
    ]);
  } catch (err) {
    return (
      <div className="mx-auto max-w-3xl px-6">
        <ErrorBanner message={toErrorMessage(err)} />
      </div>
    );
  }

  const tenant = tenants.find((tn) => tn.id === tenantId);
  if (!tenant) {
    return (
      <div className="mx-auto max-w-3xl px-6">
        <ErrorBanner message="No se encontró esa institución." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6">
      <Link href="/admin-plataforma/instituciones" className="mb-3 inline-block text-sm text-muted hover:underline">
        {t.back}
      </Link>

      <PageHeader
        title={tenant.name}
        description={tenant.active ? <Badge tone="success">{t.active}</Badge> : <Badge tone="danger">{t.inactive}</Badge>}
        actions={
          <form action={cambiarEstadoInstitucion.bind(null, tenantId, !tenant.active)}>
            {tenant.active ? (
              <ConfirmSubmitButton variant="danger" size="sm" confirmMessage={t.deactivateConfirm}>
                {t.deactivate}
              </ConfirmSubmitButton>
            ) : (
              <Button type="submit" variant="primary" size="sm">
                {t.activate}
              </Button>
            )}
          </form>
        }
      />
      {tenant.active && <p className="-mt-4 mb-6 text-xs text-muted">{t.deactivateWarning}</p>}

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {saved && (
        <SuccessBanner>{t.done}</SuccessBanner>
      )}

      {/* --- Plan --- */}
      <h2 className="mb-1 text-base font-medium">{t.planTitle}</h2>
      <p className="mb-3 text-xs text-muted">{t.planHelp}</p>
      <Card className="mb-8">
        <form action={cambiarPlanInstitucion.bind(null, tenantId)} className="flex flex-wrap items-end gap-3">
          <select name="plan" defaultValue={tenant.plan} className={selectClasses}>
            <option value="starter">{t.planStarter}</option>
            <option value="business">{t.planBusiness}</option>
            <option value="pro">{t.planPro}</option>
            <option value="enterprise">{t.planEnterprise}</option>
          </select>
          <Button type="submit" variant="primary" size="sm">
            {t.savePlan}
          </Button>
        </form>
      </Card>

      {/* --- Marca --- */}
      <h2 className="mb-3 text-base font-medium">{t.brandTitle}</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <form action={actualizarMarcaInstitucion.bind(null, tenantId)} className="flex flex-col gap-4">
            <div>
              <label className={labelClasses} htmlFor="brand-name">{t.institutionName}</label>
              <input id="brand-name" name="name" type="text" required defaultValue={branding.name} className={fieldClasses} />
            </div>
            <div>
              <span className={labelClasses}>{t.primaryColor}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="primaryColor"
                  defaultValue={branding.branding.primaryColor || '#1e90ff'}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                  title={t.colorPickerTitle}
                />
                <span className="font-mono text-xs text-muted">
                  {branding.branding.primaryColor || '#1e90ff'}
                </span>
              </div>
            </div>
            <div>
              <span className={labelClasses}>{t.backgroundColor}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="backgroundColor"
                  defaultValue={branding.branding.backgroundColor || '#1e90ff'}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                  title={t.colorPickerTitle}
                />
                <span className="font-mono text-xs text-muted">
                  {branding.branding.backgroundColor || '#1e90ff'}
                </span>
              </div>
            </div>
            <Button type="submit" size="sm" className="self-start">
              {t.saveNameAndColor}
            </Button>
          </form>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="mb-2 text-sm font-semibold">{t.logo}</h3>
            {branding.branding.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal.
              <img
                src={branding.branding.logoUrl}
                alt={t.logo}
                className="mb-3 h-14 w-auto rounded-lg border border-border bg-white object-contain"
              />
            )}
            <form action={subirLogoInstitucion.bind(null, tenantId)} className="flex flex-wrap items-center gap-2">
              <input name="file" type="file" accept="image/*" required className={fileInputClasses} />
              <Button type="submit" variant="secondary" size="sm">
                {t.uploadLogo}
              </Button>
            </form>
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold">{t.favicon}</h3>
            {branding.branding.faviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal.
              <img
                src={branding.branding.faviconUrl}
                alt={t.favicon}
                className="mb-3 h-10 w-10 rounded-lg border border-border bg-white object-contain"
              />
            )}
            <form action={subirFaviconInstitucion.bind(null, tenantId)} className="flex flex-wrap items-center gap-2">
              <input name="file" type="file" accept="image/*" required className={fileInputClasses} />
              <Button type="submit" variant="secondary" size="sm">
                {t.uploadFavicon}
              </Button>
            </form>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">{t.backgroundImage}</h3>
          {branding.branding.backgroundImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal.
            <img
              src={branding.branding.backgroundImageUrl}
              alt={t.backgroundImage}
              className="mb-3 h-32 w-full rounded-lg border border-border object-cover"
            />
          )}
          <form action={subirFondoInstitucion.bind(null, tenantId)} className="flex flex-wrap items-center gap-2">
            <input name="file" type="file" accept="image/*" required className={fileInputClasses} />
            <Button type="submit" variant="secondary" size="sm">
              {t.uploadBackground}
            </Button>
          </form>
        </Card>
      </div>

      {/* --- Dominios --- */}
      <h2 className="mb-3 text-base font-medium">{t.domainsTitle}</h2>
      <Card className="mb-8">
        {domains.length > 0 && (
          <ul className="mb-4 divide-y divide-border">
            {domains.map((d) => {
              const txtRecordName = `_stoka-verify.${d.domain}`;
              const txtRecordValue = d.verificationToken ? `stoka-verify=${d.verificationToken}` : null;

              return (
                <li key={d.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{d.domain}</span>
                    {d.isPrimary && <Badge tone="info">{t.primary}</Badge>}
                    {d.verified ? <Badge tone="success">{t.verified}</Badge> : <Badge tone="warning">{t.unverified}</Badge>}
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
                      <form action={verificarDominio.bind(null, tenantId, d.id)}>
                        <button type="submit" className="text-xs font-medium text-primary hover:underline">
                          {t.verifyNow}
                        </button>
                      </form>
                    )}
                    {!d.isPrimary && (
                      <form action={eliminarDominio.bind(null, tenantId, d.id)}>
                        <ConfirmSubmitButton
                          className="text-xs font-medium text-danger hover:underline"
                          confirmMessage={t.deleteConfirm(d.domain)}
                        >
                          {t.delete}
                        </ConfirmSubmitButton>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form action={agregarDominio.bind(null, tenantId)} className="flex flex-wrap items-center gap-2">
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

      {/* --- Mantenimiento --- */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-medium">{t.maintenanceTitle}</h2>
        {branding.maintenanceMode ? (
          <Badge tone="warning">{t.maintenanceActive}</Badge>
        ) : (
          <Badge tone="neutral">{t.maintenanceOff}</Badge>
        )}
      </div>
      <Card className="mb-4">
        <form action={guardarMantenimientoInstitucion.bind(null, tenantId)} className="space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="maintenanceMode"
              defaultChecked={branding.maintenanceMode}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm">
              <span className="font-medium">{t.enableMaintenance}</span>
              <span className="block text-xs text-muted">{t.enableMaintenanceHelp}</span>
            </span>
          </label>

          <div>
            <label className={labelClasses} htmlFor="maintenanceMessage">{t.messageLabel}</label>
            <textarea
              id="maintenanceMessage"
              name="maintenanceMessage"
              rows={3}
              maxLength={500}
              placeholder={t.messagePlaceholder}
              defaultValue={branding.maintenanceMessage ?? ''}
              className={fieldClasses}
            />
          </div>

          <div>
            <label className={labelClasses} htmlFor="maintenanceEndsAt">{t.endsAtLabel}</label>
            <input
              id="maintenanceEndsAt"
              name="maintenanceEndsAt"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(branding.maintenanceEndsAt)}
              className={`max-w-xs ${fieldClasses}`}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm">{t.save}</Button>
          </div>
        </form>
      </Card>

      <Card className="mb-8">
        <h3 className="mb-2 text-sm font-semibold">{t.maintenanceImage}</h3>
        {branding.maintenanceImageUrl && (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal. */}
            <img
              src={branding.maintenanceImageUrl}
              alt={t.maintenanceImage}
              className="mb-2 h-28 w-full rounded-lg border border-border object-cover"
            />
            <form action={quitarImagenMantenimientoInstitucion.bind(null, tenantId)}>
              <ConfirmSubmitButton
                className="text-xs font-medium text-danger hover:underline"
                confirmMessage={t.removeImageConfirm}
              >
                {t.removeImage}
              </ConfirmSubmitButton>
            </form>
          </div>
        )}
        <form
          action={subirImagenMantenimientoInstitucion.bind(null, tenantId)}
          className="flex flex-wrap items-center gap-2"
        >
          <input name="file" type="file" accept="image/*" required className={fileInputClasses} />
          <Button type="submit" variant="secondary" size="sm">
            {branding.maintenanceImageUrl ? t.replace : t.uploadImage}
          </Button>
        </form>
      </Card>

      {/* --- Miembros y roles --- */}
      <h2 className="mb-3 text-base font-medium">{t.membersTitle}</h2>
      {members.length === 0 ? (
        <p className="text-sm text-muted">{t.noMembers}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="grid grid-cols-[1.4fr_1fr_1.5rem] gap-4 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">
            <span>{t.person}</span>
            <span>{t.roles}</span>
            <span aria-hidden />
          </div>

          {members.map((m) => (
            <details key={m.userTenantId} className="group border-b border-border last:border-b-0">
              <summary className="grid cursor-pointer grid-cols-[1.4fr_1fr_1.5rem] items-center gap-4 px-4 py-3 text-sm outline-none [list-style:none] hover:bg-black/[.02] focus-visible:bg-black/[.02] dark:hover:bg-white/[.04] dark:focus-visible:bg-white/[.04] [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{m.fullName}</p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {m.roles.length === 0 ? (
                    <span className="text-xs text-muted">{t.noRole}</span>
                  ) : (
                    m.roles.map((r) => (
                      <Badge key={r.userRoleId} tone="neutral">
                        {r.roleName}
                        {r.scopeCourseTitle && ` · ${r.scopeCourseTitle}`}
                      </Badge>
                    ))
                  )}
                </div>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>

              <div className="border-t border-border bg-black/[.015] px-4 py-4 dark:bg-white/[.02]">
                <p className="mb-2 text-xs text-muted">{t.status}: {m.status}</p>

                {m.roles.length > 0 && (
                  <ul className="mb-3 flex flex-col gap-1.5">
                    {m.roles.map((r) => (
                      <li key={r.userRoleId} className="flex items-center justify-between gap-2 text-sm">
                        <span>
                          {r.roleName}
                          {r.scopeCourseTitle && <span className="text-muted"> · {r.scopeCourseTitle}</span>}
                        </span>
                        <form action={quitarRol.bind(null, tenantId, m.userTenantId, r.userRoleId)}>
                          <ConfirmSubmitButton
                            className="text-xs font-medium text-danger hover:underline"
                            confirmMessage={t.removeConfirm(r.roleName, m.fullName)}
                          >
                            {t.remove}
                          </ConfirmSubmitButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                <form action={asignarRol.bind(null, tenantId, m.userTenantId)} className="flex flex-wrap items-center gap-2">
                  <select name="roleId" required className={`max-w-[220px] ${selectClasses}`}>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm">
                    {t.assignRole}
                  </Button>
                </form>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
