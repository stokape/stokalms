// ============================================================================
// plantillas-certificado/page.tsx — Catálogo de plantillas de certificado
// (recurso de TENANT, no de curso: se crean una vez y se reutilizan al
// emitir certificados desde cualquier matrícula, ver
// ../matriculas/[enrollmentId]/certificados/page.tsx).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearPlantilla } from './actions';

interface CertificateTemplate {
  id: string;
  name: string;
}

// Punto de partida para quien crea una plantilla desde cero: usa los
// mismos placeholders que certificate-renderer.service.ts reemplaza en el
// backend (ver el comentario en create-certificate-template.dto.ts) — sin
// esto, alguien no técnico tendría que adivinar la sintaxis exacta.
const PLANTILLA_DE_EJEMPLO = `<html>
<body style="font-family: sans-serif; text-align: center; padding: 60px;">
  <h1>Certificado de Finalización</h1>
  <p>Se otorga a</p>
  <h2>{{studentName}}</h2>
  <p>por haber completado exitosamente el curso</p>
  <h3>{{courseTitle}}</h3>
  <p>Emitido el {{issueDate}}</p>
  <p>Código de verificación: {{verificationCode}}</p>
  {{qrCode}}
</body>
</html>`;

export default async function PlantillasCertificadoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const token = await requireAccessToken();

  let templates: CertificateTemplate[];
  try {
    templates = await apiFetch<CertificateTemplate[]>(token, '/certificate-templates');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const permissions = await getPermissions(token);
  const canCreate = can(permissions, 'certificate_template', 'create');

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Plantillas de certificado</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {templates.length === 0 ? (
        <p className="mb-8 text-zinc-500">Todavía no hay ninguna plantilla creada.</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {templates.map((t) => (
            <li key={t.id} className="py-3">
              <Link href={`/plantillas-certificado/${t.id}`} className="hover:underline">
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <>
          <h2 className="mb-3 text-lg font-medium">Crear plantilla</h2>
          <p className="mb-3 text-sm text-zinc-500">
            El diseño se escribe en HTML. Usa <code>{'{{studentName}}'}</code>,{' '}
            <code>{'{{courseTitle}}'}</code>, <code>{'{{issueDate}}'}</code>,{' '}
            <code>{'{{verificationCode}}'}</code> y <code>{'{{qrCode}}'}</code> donde quieras que
            aparezcan esos datos — se reemplazan automáticamente al emitir cada certificado.
          </p>
          <form action={crearPlantilla} className="flex max-w-xl flex-col gap-3">
            <input
              name="name"
              type="text"
              required
              placeholder="Nombre de la plantilla (ej. Certificado estándar)"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <textarea
              name="htmlTemplate"
              required
              rows={12}
              defaultValue={PLANTILLA_DE_EJEMPLO}
              className="rounded border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="submit"
              className="self-start rounded-full bg-foreground px-4 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Crear plantilla
            </button>
          </form>
        </>
      )}
    </div>
  );
}
