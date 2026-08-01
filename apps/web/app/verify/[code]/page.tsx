// ============================================================================
// verify/[code]/page.tsx — Verificación PÚBLICA de un certificado: la
// página a la que llega cualquiera (sin cuenta, sin iniciar sesión) al
// escanear el QR impreso en un certificado, o al pegar el enlace en el
// navegador. Por eso vive FUERA del grupo "(app)" (ver ../../(app)/layout.tsx):
// no necesita ni debe pasar por la comprobación de sesión de las demás
// pantallas — es exactamente lo que
// apps/api/src/modules/certificates/verify.controller.ts expone sin
// autenticación, del lado del backend.
// ============================================================================

import { apiFetchPublic, ApiError } from '@/lib/api';

interface VerifyResult {
  valid: boolean;
  revoked: boolean;
  studentName: string;
  courseTitle: string;
  institution: string;
  issuedAt: string;
}

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  let result: VerifyResult | null = null;
  let notFoundMessage: string | null = null;
  try {
    result = await apiFetchPublic<VerifyResult>(`/verify/${code}`);
  } catch (err) {
    notFoundMessage =
      err instanceof ApiError ? err.message : 'No se pudo verificar el certificado. Intenta de nuevo.';
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-2xl font-semibold">Verificación de certificado</h1>

      {notFoundMessage ? (
        <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-lg font-medium text-red-600 dark:text-red-400">
            Código no encontrado
          </p>
          <p className="mt-2 text-sm text-zinc-500">{notFoundMessage}</p>
        </div>
      ) : (
        result && (
          <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
            {result.valid ? (
              <p className="text-lg font-medium text-green-700 dark:text-green-400">
                ✓ Certificado válido
              </p>
            ) : (
              <p className="text-lg font-medium text-red-600 dark:text-red-400">
                ✕ Certificado revocado
              </p>
            )}
            <dl className="mt-6 space-y-3 text-left text-sm">
              <div>
                <dt className="text-zinc-500">Otorgado a</dt>
                <dd className="font-medium">{result.studentName}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Curso</dt>
                <dd className="font-medium">{result.courseTitle}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Institución</dt>
                <dd className="font-medium">{result.institution}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Fecha de emisión</dt>
                <dd className="font-medium">
                  {new Date(result.issuedAt).toLocaleDateString('es-PE', { dateStyle: 'long' })}
                </dd>
              </div>
            </dl>
          </div>
        )
      )}
    </div>
  );
}
