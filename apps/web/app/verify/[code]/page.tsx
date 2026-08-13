// ============================================================================
// verify/[code]/page.tsx — Verificación PÚBLICA de un certificado: la
// página a la que llega cualquiera (sin cuenta, sin iniciar sesión) al
// escanear el QR impreso en un certificado, o al pegar el enlace en el
// navegador. Por eso vive FUERA del grupo "(app)" (ver ../../(app)/layout.tsx):
// no necesita ni debe pasar por la comprobación de sesión de las demás
// pantallas — es exactamente lo que
// apps/api/src/modules/certificates/verify.controller.ts expone sin
// autenticación, del lado del backend.
//
// REDISEÑADA (antes: texto plano sobre zinc-50/black, sin logo ni
// componentes compartidos) — es la pantalla de MÁS visibilidad fuera de la
// propia institución: la ve un tercero (un empleador, otra institución)
// validando que un documento sea auténtico. Ahora usa Card/Badge y el
// LOGO real de la institución (ver certificate.service.ts,
// "institutionLogoUrl") en vez del isotipo genérico de Stoka — es SU
// certificado, no el de la plataforma.
// ============================================================================

import { apiFetchPublic, ApiError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StokaMark } from '@/components/StokaLogo';
import { StokaBrandingBadge } from '@/components/StokaBrandingBadge';

interface VerifyResult {
  valid: boolean;
  revoked: boolean;
  studentName: string;
  courseTitle: string;
  institution: string;
  institutionLogoUrl?: string;
  issuedAt: string;
  hideStokaBranding: boolean;
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 py-12 text-center">
      <div className="flex flex-col items-center gap-2">
        <StokaMark className="h-8 w-8 opacity-60" title="Stoka LMS" />
        <h1 className="text-lg font-medium text-muted">Verificación de certificado</h1>
      </div>

      {notFoundMessage ? (
        <Card className="w-full max-w-md">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-lg font-semibold">Código no encontrado</p>
          <p className="mt-2 text-sm text-muted">{notFoundMessage}</p>
        </Card>
      ) : (
        result && (
          <Card className="w-full max-w-md">
            {/* Logo de LA INSTITUCIÓN (nunca el de Stoka) — es su
               certificado. Sin logo propio, se cae al isotipo de marca
               como respaldo neutro, no a un espacio vacío. */}
            {result.institutionLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal de una institución cualquiera, no un asset local.
              <img
                src={result.institutionLogoUrl}
                alt={result.institution}
                className="mx-auto mb-4 h-14 w-auto object-contain"
              />
            ) : (
              <StokaMark className="mx-auto mb-4 h-12 w-12" title={result.institution} />
            )}

            <p className="text-base font-semibold">{result.institution}</p>

            <div className="mt-4 flex justify-center">
              {result.valid ? (
                <Badge tone="success">✓ Certificado válido</Badge>
              ) : (
                <Badge tone="danger">✕ Certificado revocado</Badge>
              )}
            </div>

            <dl className="mt-6 space-y-3 border-t border-border pt-6 text-left text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Otorgado a</dt>
                <dd className="text-right font-medium">{result.studentName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Curso</dt>
                <dd className="text-right font-medium">{result.courseTitle}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Fecha de emisión</dt>
                <dd className="text-right font-medium">
                  {new Date(result.issuedAt).toLocaleDateString('es-PE', { dateStyle: 'long' })}
                </dd>
              </div>
            </dl>
          </Card>
        )
      )}

      {/* Esta pagina la ve alguien AJENO a la institucion (quien escaneo el
         QR) — es el lugar de mas visibilidad fuera de la propia
         institucion para el sello, por eso se respeta el mismo toggle que
         /configuracion-marca aunque el resto de esta pantalla no tenga
         nada mas "de marca". */}
      {result && !result.hideStokaBranding && (
        <StokaBrandingBadge label="Verificado con Stoka LMS" />
      )}
    </div>
  );
}
