'use client';

// ============================================================================
// InstitucionForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/éxito de cada
// accion sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { fieldClasses, labelClasses, fileInputClasses, selectClasses } from '@/components/ui/field-styles';
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

type ActionState = { error: string | null; saved?: boolean };
const INITIAL_STATE: ActionState = { error: null };

export function EstadoInstitucionForm({
  tenantId,
  active,
  deactivateLabel,
  activateLabel,
  confirmMessage,
}: {
  tenantId: string;
  active: boolean;
  deactivateLabel: string;
  activateLabel: string;
  confirmMessage: string;
}) {
  const [state, formAction, pending] = useActionState(
    cambiarEstadoInstitucion.bind(null, tenantId, !active),
    INITIAL_STATE,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (active && !window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <Button type="submit" variant={active ? 'danger' : 'primary'} size="sm" disabled={pending}>
          {active ? deactivateLabel : activateLabel}
        </Button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function PlanForm({
  tenantId,
  plan,
  options,
  submitLabel,
  submittingLabel,
}: {
  tenantId: string;
  plan: string;
  options: Array<{ value: string; label: string }>;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(cambiarPlanInstitucion.bind(null, tenantId), INITIAL_STATE);

  return (
    <div>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <select name="plan" defaultValue={plan} className={selectClasses}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </div>
  );
}

export function MarcaInstitucionForm({
  tenantId,
  name,
  primaryColor,
  backgroundColor,
  t,
}: {
  tenantId: string;
  name: string;
  primaryColor: string;
  backgroundColor: string;
  t: {
    institutionName: string;
    primaryColor: string;
    backgroundColor: string;
    colorPickerTitle: string;
    saveNameAndColor: string;
    saving: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    actualizarMarcaInstitucion.bind(null, tenantId),
    INITIAL_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className={labelClasses} htmlFor="brand-name">{t.institutionName}</label>
          <input id="brand-name" name="name" type="text" required defaultValue={name} className={fieldClasses} />
        </div>
        <div>
          <span className={labelClasses}>{t.primaryColor}</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="primaryColor"
              defaultValue={primaryColor}
              className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
              title={t.colorPickerTitle}
            />
            <span className="font-mono text-xs text-muted">{primaryColor}</span>
          </div>
        </div>
        <div>
          <span className={labelClasses}>{t.backgroundColor}</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="backgroundColor"
              defaultValue={backgroundColor}
              className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
              title={t.colorPickerTitle}
            />
            <span className="font-mono text-xs text-muted">{backgroundColor}</span>
          </div>
        </div>
        <Button type="submit" size="sm" className="self-start" disabled={pending}>
          {pending ? t.saving : t.saveNameAndColor}
        </Button>
      </form>
    </>
  );
}

function UploadImageForm({
  action,
  submitLabel,
  submittingLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <div>
      {state.error && (
        <div className="mb-2">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input name="file" type="file" accept="image/*" required className={fileInputClasses} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </div>
  );
}

export function LogoInstitucionForm({
  tenantId,
  submitLabel,
  submittingLabel,
}: {
  tenantId: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  return (
    <UploadImageForm
      action={subirLogoInstitucion.bind(null, tenantId)}
      submitLabel={submitLabel}
      submittingLabel={submittingLabel}
    />
  );
}

export function FaviconInstitucionForm({
  tenantId,
  submitLabel,
  submittingLabel,
}: {
  tenantId: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  return (
    <UploadImageForm
      action={subirFaviconInstitucion.bind(null, tenantId)}
      submitLabel={submitLabel}
      submittingLabel={submittingLabel}
    />
  );
}

export function FondoInstitucionForm({
  tenantId,
  submitLabel,
  submittingLabel,
}: {
  tenantId: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  return (
    <UploadImageForm
      action={subirFondoInstitucion.bind(null, tenantId)}
      submitLabel={submitLabel}
      submittingLabel={submittingLabel}
    />
  );
}

export function VerificarDominioButton({ tenantId, domainId, label }: { tenantId: string; domainId: string; label: string }) {
  const [state, formAction, pending] = useActionState(
    verificarDominio.bind(null, tenantId, domainId),
    INITIAL_STATE,
  );

  return (
    <div>
      <form action={formAction}>
        <button type="submit" disabled={pending} className="text-xs font-medium text-primary hover:underline">
          {label}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function EliminarDominioButton({
  tenantId,
  domainId,
  confirmMessage,
  label,
}: {
  tenantId: string;
  domainId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    eliminarDominio.bind(null, tenantId, domainId),
    INITIAL_STATE,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <button type="submit" disabled={pending} className="text-xs font-medium text-danger hover:underline">
          {label}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function AgregarDominioForm({
  tenantId,
  placeholder,
  submitLabel,
  submittingLabel,
}: {
  tenantId: string;
  placeholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(agregarDominio.bind(null, tenantId), INITIAL_STATE);

  return (
    <div>
      {state.error && (
        <div className="mb-2">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input name="domain" type="text" required placeholder={placeholder} className={`max-w-xs ${fieldClasses}`} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </div>
  );
}

export function MantenimientoInstitucionForm({
  tenantId,
  maintenanceMode,
  maintenanceMessage,
  maintenanceEndsAtValue,
  t,
}: {
  tenantId: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceEndsAtValue: string;
  t: {
    enableMaintenance: string;
    enableMaintenanceHelp: string;
    messageLabel: string;
    messagePlaceholder: string;
    endsAtLabel: string;
    save: string;
    saving: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    guardarMantenimientoInstitucion.bind(null, tenantId),
    INITIAL_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-4">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="space-y-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="maintenanceMode"
            defaultChecked={maintenanceMode}
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
            defaultValue={maintenanceMessage}
            className={fieldClasses}
          />
        </div>

        <div>
          <label className={labelClasses} htmlFor="maintenanceEndsAt">{t.endsAtLabel}</label>
          <input
            id="maintenanceEndsAt"
            name="maintenanceEndsAt"
            type="datetime-local"
            defaultValue={maintenanceEndsAtValue}
            className={`max-w-xs ${fieldClasses}`}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? t.saving : t.save}
          </Button>
        </div>
      </form>
    </>
  );
}

export function QuitarImagenMantenimientoButton({
  tenantId,
  confirmMessage,
  label,
}: {
  tenantId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    quitarImagenMantenimientoInstitucion.bind(null, tenantId),
    INITIAL_STATE,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <button type="submit" disabled={pending} className="text-xs font-medium text-danger hover:underline">
          {label}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function SubirImagenMantenimientoForm({
  tenantId,
  submitLabel,
  submittingLabel,
}: {
  tenantId: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  return (
    <UploadImageForm
      action={subirImagenMantenimientoInstitucion.bind(null, tenantId)}
      submitLabel={submitLabel}
      submittingLabel={submittingLabel}
    />
  );
}

export function QuitarRolButton({
  tenantId,
  userTenantId,
  userRoleId,
  confirmMessage,
  label,
}: {
  tenantId: string;
  userTenantId: string;
  userRoleId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    quitarRol.bind(null, tenantId, userTenantId, userRoleId),
    INITIAL_STATE,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <button type="submit" disabled={pending} className="text-xs font-medium text-danger hover:underline">
          {label}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function AsignarRolForm({
  tenantId,
  userTenantId,
  roles,
  submitLabel,
  submittingLabel,
}: {
  tenantId: string;
  userTenantId: string;
  roles: Array<{ id: string; name: string }>;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    asignarRol.bind(null, tenantId, userTenantId),
    INITIAL_STATE,
  );

  return (
    <div>
      {state.error && <p className="mb-1 text-xs text-danger">{state.error}</p>}
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <select name="roleId" required className={`max-w-[220px] ${selectClasses}`}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </div>
  );
}
