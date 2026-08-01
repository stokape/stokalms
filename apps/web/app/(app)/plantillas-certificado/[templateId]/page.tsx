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
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { editarPlantilla, eliminarPlantilla } from './actions';

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

  let template: CertificateTemplate;
  try {
    template = await apiFetch<CertificateTemplate>(token, `/certificate-templates/${templateId}`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/plantillas-certificado" className="text-sm text-zinc-500 hover:underline">
        &larr; Plantillas de certificado
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{template.name}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {saved && (
        <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Los cambios se guardaron correctamente.
        </p>
      )}

      <h2 className="mb-3 text-lg font-medium">Vista previa</h2>
      <p className="mb-3 text-sm text-zinc-500">
        Los textos entre llaves dobles (ej. <code>{'{{studentName}}'}</code>) se ven tal cual acá — se
        reemplazan por los datos reales recién al emitir un certificado de verdad.
      </p>
      <iframe
        title={`Vista previa de ${template.name}`}
        srcDoc={template.htmlTemplate}
        sandbox=""
        className="mb-8 h-96 w-full rounded-lg border border-zinc-300 bg-white dark:border-zinc-700"
      />

      <h2 className="mb-3 text-lg font-medium">Editar</h2>
      <form
        action={editarPlantilla.bind(null, templateId)}
        className="mb-8 flex max-w-xl flex-col gap-3"
      >
        <input
          name="name"
          type="text"
          required
          defaultValue={template.name}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <textarea
          name="htmlTemplate"
          required
          rows={12}
          defaultValue={template.htmlTemplate}
          className="rounded border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Guardar cambios
        </button>
      </form>

      <h2 className="mb-3 text-lg font-medium">Eliminar plantilla</h2>
      <p className="mb-3 text-sm text-zinc-500">
        Solo se puede eliminar si NINGÚN certificado fue emitido todavía con esta plantilla.
      </p>
      <form action={eliminarPlantilla.bind(null, templateId)}>
        <button type="submit" className="text-sm text-red-600 underline dark:text-red-400">
          Eliminar esta plantilla
        </button>
      </form>
    </div>
  );
}
