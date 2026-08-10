// ============================================================================
// StokaLogo.tsx — Isotipo OFICIAL de Stoka LMS: la "S" en forma de cinta
// origami con un birrete apoyado en el pliegue, tal como lo mandó el
// usuario (brand kit "Opción 2") — no una reinterpretación. El archivo
// original venía sobre fondo negro (pensado para un moodboard, no para
// pantalla); "public/brand/logo-mark.png" es ese mismo render con el
// fondo quitado (alpha por luminancia + "un-premultiply" para que no
// quede un halo oscuro al componer sobre blanco — ver el historial del
// script que lo generó), recortado al contenido real. Por eso funciona
// igual de bien sobre superficie clara u oscura sin variantes aparte.
//
// Es una imagen rasterizada (no vector: el original es un render 3D con
// reflejos, no algo que se pueda "trazar" a SVG sin perder el look
// metálico) — el recorte del ícono es de sobra grande (296×325px) para
// cualquier uso en esta app (el más grande es h-14, 56px), así que nunca
// se ve pixelado achicándolo.
//
// Dos usos:
//   <StokaMark />  — solo el isotipo (favicon, ícono de barra lateral).
//   <StokaWordmark /> — isotipo + "STOKA LMS" en texto real (no imagen:
//     así se ve nítido a cualquier tamaño, hereda el color/tema de la
//     página, y sigue siendo texto seleccionable/accesible).
// ============================================================================

export function StokaMark({ className, title = 'Stoka LMS' }: { className?: string; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- asset local en
    // /public con muchos tamaños distintos segun donde se use (ver arriba);
    // next/image exige width/height fijos que complicarian innecesariamente
    // cada punto de uso para lo que ya es un PNG chico y liviano.
    <img src="/brand/logo-mark.png" alt={title} className={`${className ?? ''} object-contain`} />
  );
}

export function StokaWordmark({
  className,
  markClassName = 'h-8 w-8',
  tagline = false,
}: {
  className?: string;
  markClassName?: string;
  /** Muestra "Educación virtual" debajo, como en el lockup del brand kit — solo para lugares con espacio de sobra (ej. la landing). */
  tagline?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <StokaMark className={`shrink-0 ${markClassName}`} />
      <span className="flex flex-col leading-none">
        <span className="text-base font-extrabold tracking-tight text-foreground">
          STOKA <span className="text-primary">LMS</span>
        </span>
        {tagline && <span className="mt-0.5 text-xs font-normal text-muted">Educación virtual</span>}
      </span>
    </span>
  );
}
