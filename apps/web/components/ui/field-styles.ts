// ============================================================================
// field-styles.ts — Clases compartidas para inputs/selects/textareas. Antes
// cada formulario repetía a mano "rounded border border-zinc-300 px-3 py-2
// dark:border-zinc-700 dark:bg-zinc-900" — funcional, pero sin ningún
// estado de foco visible ni distinción para los <select> (los
// "desplegables" que se pidió que se notaran más).
// ============================================================================

export const fieldClasses =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground ' +
  'transition-colors placeholder:text-muted ' +
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

// Los <select> nativos ya traen su propia flechita en la mayoría de
// navegadores, pero sin remarcarla quedan visualmente idénticos a un
// <input> de texto — "appearance-none" + una flecha propia (vía
// background-image en Tailwind no hace falta: alcanza con un padding-right
// y un ícono unicode) los distingue de un vistazo como "esto se despliega".
export const selectClasses =
  fieldClasses +
  ' appearance-none bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%2364748b"><path d="M5.5 7.5l4.5 5 4.5-5z"/></svg>\')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem] pr-9';

export const labelClasses = 'mb-1 block text-xs font-medium text-muted';

// El <input type="file"> nativo trae un botón gris de sistema operativo que
// no se puede recolorear directamente — pero el pseudo-elemento file: de
// Tailwind sí permite estilizar esa parte del control sin JS ni un input
// oculto+label falso, manteniendo el progressive-enhancement del resto del
// formulario.
export const fileInputClasses =
  'block w-full text-xs text-muted file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 ' +
  'file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20';
