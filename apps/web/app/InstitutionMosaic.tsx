// ============================================================================
// InstitutionMosaic.tsx — La firma visual del hero de PlatformLanding.tsx.
//
// POR QUE ESTO Y NO UN DEGRADADO DECORATIVO: lo único genuinamente distinto
// de Stoka LMS es que la MISMA plataforma se ve completamente distinta según
// qué institución la visite — su propio logo, su propio color (ver
// Tenant.branding en schema.prisma, y BrandingStudio.tsx donde cada
// institución lo elige). Un degradado de fondo no dice nada de eso; una
// vitrina de tarjetas de institución CAMBIANDO de identidad en bucle sí — es
// el producto mostrándose a sí mismo, no una decoración importada de
// cualquier landing de SaaS.
//
// Las instituciones de abajo son FICTICIAS (nombres genéricos, sin
// coincidencia buscada con ninguna real) — es una vitrina de ejemplo, no
// datos reales de clientes.
//
// 100% CSS, sin JavaScript ni Client Component: cada tarjeta tiene la MISMA
// animación de key frames con un "animation-delay" negativo distinto, el
// truco clásico para un carrusel sin JS. Con "prefers-reduced-motion", la
// animación se desactiva y queda fija en la primera tarjeta (ver
// globals.css) — nunca un carrusel forzado para quien pidió menos movimiento.
// ============================================================================

const SHOWCASE_INSTITUTIONS = [
  { name: 'Instituto San Rafael', initial: 'R', color: '#C7592D' },
  { name: 'Universidad Cordillera', initial: 'C', color: '#2F7A5C' },
  { name: 'Academia Lumbre', initial: 'L', color: '#B8892B' },
  { name: 'Centro Vértice', initial: 'V', color: '#3468A0' },
  { name: 'Instituto Alba', initial: 'A', color: '#B14A68' },
] as const;

export function InstitutionMosaic() {
  return (
    <div
      className="mosaic group relative mx-auto aspect-[4/5] w-full max-w-[15rem] sm:max-w-[17rem]"
      aria-hidden="true"
    >
      {SHOWCASE_INSTITUTIONS.map((inst, i) => (
        <div
          key={inst.name}
          className="mosaic-card absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-black/5 px-6 text-center shadow-lg"
          style={{
            background: inst.color,
            // "--i" alimenta el animation-delay negativo en globals.css —
            // Tailwind no tiene una utilidad para esto, es una variable CSS
            // a mano leída desde el keyframe (ver .mosaic-card).
            ['--i' as string]: i,
          }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-xl font-bold"
            style={{ color: inst.color }}
          >
            {inst.initial}
          </div>
          <p className="text-sm font-semibold text-white">{inst.name}</p>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
            Iniciar sesión
          </span>
        </div>
      ))}
    </div>
  );
}
