// ============================================================================
// matriculas/[enrollmentId]/certificados/page.tsx — Certificados de UNA
// matricula: sirve tanto para un Estudiante viendo los SUYOS (permiso
// "certificate:view_own", ver CertificateService.assertCanViewCertificatesOf
// en el backend) como para Coordinador/Docente emitiendo/revocando los de
// cualquier estudiante (permiso amplio "certificate:view"/"issue"/"revoke").
//
// El formulario de EMITIR necesita elegir una plantilla — para eso pide
// tambien GET /certificate-templates, pero en un try/catch SEPARADO: un
// Estudiante no tiene permiso para ver el catalogo de plantillas
// (certificate_template:view), y eso NO deberia romper el resto de la
// pagina (sus propios certificados si los puede ver) — simplemente no se
// le muestra el formulario de emision, que de todas formas no podria usar.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { emitirCertificado, revocarCertificado } from './actions';

interface Certificate {
  id: string;
  verificationCode: string;
  issuedAt: string;
  revoked: boolean;
  downloadUrl: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
}

export default async function CertificadosDeMatriculaPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { enrollmentId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();

  let certificates: Certificate[];
  try {
    certificates = await apiFetch<Certificate[]>(token, `/enrollments/${enrollmentId}/certificates`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Ver el comentario de arriba: si esto falla (tipicamente un Estudiante
  // sin permiso para ver plantillas), simplemente no se ofrece el
  // formulario de emision — no es un error que deba interrumpir la pagina.
  let templates: CertificateTemplate[] | null = null;
  try {
    templates = await apiFetch<CertificateTemplate[]>(token, '/certificate-templates');
  } catch {
    templates = null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/mis-matriculas" className="text-sm text-zinc-500 hover:underline">
        &larr; Mis matrículas
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Certificados</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {certificates.length === 0 ? (
        <p className="mb-8 text-zinc-500">
          Todavía no se emitió ningún certificado para esta matrícula.
        </p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {certificates.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-mono text-sm">{c.verificationCode}</p>
                <p className="text-sm text-zinc-500">
                  Emitido el {new Date(c.issuedAt).toLocaleDateString('es-PE', { dateStyle: 'long' })}
                  {' · '}
                  {c.revoked ? (
                    <span className="text-red-600 dark:text-red-400">Revocado</span>
                  ) : (
                    <span className="text-green-700 dark:text-green-400">Vigente</span>
                  )}
                </p>
                <Link href={`/verify/${c.verificationCode}`} className="text-sm underline">
                  Ver página de verificación pública
                </Link>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <a href={c.downloadUrl} className="text-sm underline" target="_blank" rel="noreferrer">
                  Descargar PDF
                </a>
                {!c.revoked && (
                  <form action={revocarCertificado.bind(null, enrollmentId, c.id)}>
                    <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                      Revocar
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {templates && (
        <>
          <h2 className="mb-3 text-lg font-medium">Emitir un nuevo certificado</h2>
          {templates.length === 0 ? (
            <p className="text-zinc-500">
              Todavía no hay ninguna plantilla de certificado creada.{' '}
              <Link href="/plantillas-certificado" className="underline">
                Crear una plantilla
              </Link>
              .
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-zinc-500">
                Solo se puede emitir si la matrícula ya está en estado &quot;Completado&quot;.
              </p>
              <form action={emitirCertificado.bind(null, enrollmentId)} className="flex max-w-sm flex-col gap-3">
                <select
                  name="templateId"
                  required
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-foreground px-4 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                >
                  Emitir certificado
                </button>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
}
