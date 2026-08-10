// ============================================================================
// precios/page.tsx — "Planes y precios" ya NO es una pagina aparte: vive
// como una seccion dentro de la home (ver "id=precios" en
// PlatformLanding.tsx, y PricingSection.tsx que arma esa seccion). Esta
// ruta se deja como REDIRECT (no se borra del todo) para no romper ningun
// enlace que ya se haya compartido apuntando a "/precios" — cualquiera que
// lo visite cae directo en la seccion correcta de la home.
// ============================================================================

import { redirect } from 'next/navigation';

export default function PreciosRedirectPage(): never {
  redirect('/#precios');
}
