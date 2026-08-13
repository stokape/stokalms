// ============================================================================
// plantillas-certificado/[templateId]/page.tsx — Detalle de UNA plantilla:
// vista previa del diseño, edición y eliminación.
//
// FALTABA ESTA PANTALLA: la lista (../page.tsx) solo mostraba el NOMBRE de
// cada plantilla como texto plano, sin forma de abrirla — quien creaba una
// plantilla no tenía manera de "verla" despues (se detecto probando de
// verdad: se crearon plantillas de prueba y no habia adonde hacer clic).
//
// La vista previa usa un <iframe> con "srcDoc" (en vez de insertar el HTML
// directo en la pagina) para que los estilos/etiquetas de la plantilla no
// interfieran con el resto de la pantalla — es HTML de la MISMA
// institución (quien lo escribe ya tiene permiso de "certificate_template:edit"),
// pero igual se le agrega "sandbox" sin "allow-scripts" para que, aunque
// alguien pegara un <script> por error o a proposito, nunca se ejecute
// dentro de esta pantalla de administracion.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { fieldClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import { editarPlantilla, eliminarPlantilla } from './actions';

const TEXT = {
  es: {
    back: '← Plantillas de certificado',
    saved: 'Los cambios se guardaron correctamente.',
    preview: 'Vista previa',
    previewHelp: 'Los textos entre llaves dobles (ej. {{studentName}}) se ven tal cual aquí — se reemplazan por los datos reales recién al emitir un certificado de verdad.',
    previewTitle: (name: string) => `Vista previa de ${name}`,
    edit: 'Editar',
    saveChanges: 'Guardar cambios',
    deleteTemplate: 'Eliminar plantilla',
    deleteHelp: 'Solo se puede eliminar si NINGÚN certificado fue emitido todavía con esta plantilla.',
    deleteThis: 'Eliminar esta plantilla',
    deleteConfirm: '¿Eliminar esta plantilla? No se puede deshacer.',
  },
  en: {
    back: '← Certificate templates',
    saved: 'Your changes were saved successfully.',
    preview: 'Preview',
    previewHelp: 'Text between double braces (e.g. {{studentName}}) shows as-is here — it gets replaced with real data only when an actual certificate is issued.',
    previewTitle: (name: string) => `Preview of ${name}`,
    edit: 'Edit',
    saveChanges: 'Save changes',
    deleteTemplate: 'Delete template',
    deleteHelp: 'This can only be deleted if NO certificate has been issued with this template yet.',
    deleteThis: 'Delete this template',
    deleteConfirm: "Delete this template? This can't be undone.",
  },
};

interface CertificateTemplate {
  id: string;
  name: string;
  htmlTemplate: string;
}

export default async function PlantillaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { templateId } = await params;
  const { error, saved } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let template: CertificateTemplate;
  try {
    template = await apiFetch<CertificateTemplate>(token, `/certificate-templates/${templateId}`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const permissions = await getPermissions(token);
  const canEdit = can(permissions, 'certificate_template', 'edit');
  const canDelete = can(permissions, 'certificate_template', 'delete');

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/plantillas-certificado" className="text-sm text-muted hover:underline">
        {t.back}
      </Link>
      <PageHeader title={template.name} />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {saved && (
        <div className="mb-6 rounded-lg bg-success-bg px-4 py-3 text-sm text-success">
          {t.saved}
        </div>
      )}

      <Card className="mb-8">
        <h2 className="mb-1 text-base font-medium">{t.preview}</h2>
        <p className="mb-3 text-sm text-muted">{t.previewHelp}</p>
        <iframe
          title={t.previewTitle(template.name)}
          srcDoc={template.htmlTemplate}
          sandbox=""
          className="h-96 w-full rounded-lg border border-border bg-white"
        />
      </Card>

      {canEdit && (
        <Card className="mb-8">
          <h2 className="mb-3 text-base font-medium">{t.edit}</h2>
          <form action={editarPlantilla.bind(null, templateId)} className="flex flex-col gap-3">
            <input
              name="name"
              type="text"
              required
              defaultValue={template.name}
              className={fieldClasses}
            />
            <textarea
              name="htmlTemplate"
              required
              rows={12}
              defaultValue={template.htmlTemplate}
              className={`${fieldClasses} font-mono text-xs`}
            />
            <Button type="submit" className="self-start">
              {t.saveChanges}
            </Button>
          </form>
        </Card>
      )}

      {canDelete && (
        <Card>
          <h2 className="mb-2 text-base font-medium">{t.deleteTemplate}</h2>
          <p className="mb-3 text-sm text-muted">{t.deleteHelp}</p>
          <form action={eliminarPlantilla.bind(null, templateId)}>
            <ConfirmSubmitButton
              className="text-sm font-medium text-danger hover:underline"
              confirmMessage={t.deleteConfirm}
            >
              {t.deleteThis}
            </ConfirmSubmitButton>
          </form>
        </Card>
      )}
    </div>
  );
}
