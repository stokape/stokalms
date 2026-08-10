// ============================================================================
// StokaBrandingBadge.tsx — El sello "Hecho con Stoka LMS" que aparece por
// defecto en el home público de cada institución, el pie de la app
// logueada y la página pública de verificación de certificados. Cualquier
// Administrador de entidad lo puede ocultar desde /configuracion-marca
// (campo "hideStokaBranding", ver update-tenant.dto.ts) — este componente
// no decide nada, solo lo dibuja: quien lo usa ya resolvió si corresponde
// mostrarlo (ver InstitutionHome.tsx, (app)/layout.tsx, verify/[code]/page.tsx).
// ============================================================================

import { StokaMark } from './StokaLogo';

export function StokaBrandingBadge({ label, className }: { label: string; className?: string }) {
  return (
    <p className={`flex items-center justify-center gap-1.5 text-xs text-muted ${className ?? ''}`}>
      <StokaMark className="h-3.5 w-3.5 opacity-70" title="Stoka LMS" />
      {label}
    </p>
  );
}
