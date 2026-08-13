// ============================================================================
// mantenimiento/page.tsx — Prender/apagar el modo mantenimiento del tenant
// activo: reemplaza el home publico (ver app/page.tsx) y bloquea el resto
// de la app (ver (app)/layout.tsx) para cualquiera SIN el permiso
// "tenant:edit" (Super Admin / Administrador de entidad, ver
// prisma/seed.js) — igual que Dominios y Configuración de marca; cualquier
// otro rol ve el mensaje de "no tienes permiso" habitual.
//
// A quien SI tiene el permiso nunca lo bloquea: puede seguir entrando (y
// entrando aquí) para volver a apagarlo — ver la nota en app/page.tsx sobre
// por qué el botón de "Iniciar sesión" nunca desaparece del todo.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { fieldClasses, labelClasses, fileInputClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import {
  guardarMantenimiento,
  subirImagenMantenimiento,
  quitarImagenMantenimiento,
} from './actions';

const TEXT = {
  es: {
    title: 'Mantenimiento',
    description: 'Mientras esté activo, cualquiera que no tenga tu mismo permiso va a ver una pantalla de aviso en vez de la plataforma — tú vas a poder seguir entrando con normalidad para volver a apagarlo.',
    active: 'Activo',
    off: 'Apagado',
    done: 'Listo.',
    enable: 'Activar modo mantenimiento',
    enableHelp: (name: string) => `Reemplaza el home público de ${name} y bloquea el resto de la app para todos los roles menos el tuyo.`,
    messageLabel: 'Mensaje para quien visite la plataforma',
    messagePlaceholder: 'Estamos haciendo tareas de mantenimiento. Volvemos en un rato.',
    endsAtLabel: 'Vuelve aproximadamente a las (opcional)',
    endsAtHelp: 'Solo informativo: no apaga el mantenimiento solo, hay que volver aquí para eso.',
    save: 'Guardar',
    backgroundImage: 'Imagen de fondo (opcional)',
    backgroundHelp: (name: string) => `Libre — no tiene que ser la marca de todos los días de ${name}. Es solo para este aviso puntual (ej. una foto de la mudanza, un diseño con su propio mensaje). Si no subes ninguna, el aviso se muestra con el fondo difuminado habitual de la institución.`,
    backgroundAlt: 'Imagen de fondo del aviso de mantenimiento',
    removeImage: 'Quitar imagen',
    removeImageConfirm: '¿Quitar esta imagen?',
    replace: 'Reemplazar',
    uploadImage: 'Subir imagen',
    preview: 'Vista previa del aviso',
    defaultMessage: 'Estamos haciendo tareas de mantenimiento.',
  },
  en: {
    title: 'Maintenance',
    description: "While this is on, anyone without your same permission will see a notice screen instead of the platform — you'll still be able to log in as usual to turn it off again.",
    active: 'Active',
    off: 'Off',
    done: 'Done.',
    enable: 'Enable maintenance mode',
    enableHelp: (name: string) => `Replaces ${name}'s public home page and locks the rest of the app for every role except yours.`,
    messageLabel: 'Message for anyone who visits the platform',
    messagePlaceholder: "We're doing maintenance work. Back shortly.",
    endsAtLabel: 'Back around (optional)',
    endsAtHelp: "Informational only: it doesn't turn maintenance off by itself, you need to come back here for that.",
    save: 'Save',
    backgroundImage: 'Background image (optional)',
    backgroundHelp: (name: string) => `Free choice — it doesn't have to be ${name}'s everyday branding. It's just for this one-off notice (e.g. a moving-day photo, a design with its own message). If you don't upload one, the notice shows the institution's usual blurred background.`,
    backgroundAlt: 'Maintenance notice background image',
    removeImage: 'Remove image',
    removeImageConfirm: 'Remove this image?',
    replace: 'Replace',
    uploadImage: 'Upload image',
    preview: 'Notice preview',
    defaultMessage: "We're doing maintenance work.",
  },
};

interface TenantInfo {
  name: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  maintenanceEndsAt: string | null;
  maintenanceImageUrl?: string;
}

// El backend guarda maintenanceEndsAt en UTC (columna TIMESTAMP) — un
// <input type="datetime-local"> necesita "YYYY-MM-DDTHH:mm" en hora LOCAL
// del navegador para mostrar de vuelta lo que se habia tipeado, si no
// quedaria desfasado por el huso horario en cada recarga.
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function MantenimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let tenant: TenantInfo;
  try {
    tenant = await apiFetch<TenantInfo>(token, '/tenant');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          tenant.maintenanceMode ? (
            <Badge tone="warning">{t.active}</Badge>
          ) : (
            <Badge tone="neutral">{t.off}</Badge>
          )
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {saved && (
        <SuccessBanner>{t.done}</SuccessBanner>
      )}

      <Card>
        <form action={guardarMantenimiento} className="space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="maintenanceMode"
              defaultChecked={tenant.maintenanceMode}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm">
              <span className="font-medium">{t.enable}</span>
              <span className="block text-xs text-muted">{t.enableHelp(tenant.name)}</span>
            </span>
          </label>

          <div>
            <label className={labelClasses} htmlFor="maintenanceMessage">
              {t.messageLabel}
            </label>
            <textarea
              id="maintenanceMessage"
              name="maintenanceMessage"
              rows={3}
              maxLength={500}
              placeholder={t.messagePlaceholder}
              defaultValue={tenant.maintenanceMessage ?? ''}
              className={fieldClasses}
            />
          </div>

          <div>
            <label className={labelClasses} htmlFor="maintenanceEndsAt">
              {t.endsAtLabel}
            </label>
            <input
              id="maintenanceEndsAt"
              name="maintenanceEndsAt"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(tenant.maintenanceEndsAt)}
              className={`max-w-xs ${fieldClasses}`}
            />
            <p className="mt-1 text-xs text-muted">{t.endsAtHelp}</p>
          </div>

          <div className="flex justify-end">
            <Button type="submit">{t.save}</Button>
          </div>
        </form>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-1 text-sm font-semibold">{t.backgroundImage}</h2>
        <p className="mb-4 text-xs text-muted">{t.backgroundHelp(tenant.name)}</p>

        {tenant.maintenanceImageUrl && (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tenant.maintenanceImageUrl}
              alt={t.backgroundAlt}
              className="mb-2 h-32 w-full rounded-lg border border-border object-cover"
            />
            <form action={quitarImagenMantenimiento}>
              <ConfirmSubmitButton
                className="text-xs font-medium text-danger hover:underline"
                confirmMessage={t.removeImageConfirm}
              >
                {t.removeImage}
              </ConfirmSubmitButton>
            </form>
          </div>
        )}

        <form action={subirImagenMantenimiento} className="flex flex-wrap items-center gap-3">
          <input type="file" name="file" accept="image/*" required className={fileInputClasses} />
          <Button type="submit" variant="secondary" size="sm">
            {tenant.maintenanceImageUrl ? t.replace : t.uploadImage}
          </Button>
        </form>
      </Card>

      {(tenant.maintenanceMessage || tenant.maintenanceImageUrl) && (
        <Card className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">{t.preview}</h2>
          <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-lg border border-border">
            {tenant.maintenanceImageUrl && (
              <>
                <div
                  className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
                  style={{ backgroundImage: `url(${tenant.maintenanceImageUrl})` }}
                />
                <div className="absolute inset-0 bg-black/45" />
              </>
            )}
            <div
              className={
                'relative w-64 rounded-xl border p-4 text-center shadow-lg ' +
                (tenant.maintenanceImageUrl
                  ? 'border-white/10 bg-white/95 dark:bg-zinc-900/95'
                  : 'border-border bg-surface')
              }
            >
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-warning-bg text-warning">
                🔧
              </div>
              <p className="text-xs font-semibold">{tenant.name}</p>
              <p className="mt-1 text-xs text-muted">
                {tenant.maintenanceMessage || t.defaultMessage}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
