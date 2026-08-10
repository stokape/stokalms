// ============================================================================
// button-styles.ts — Las clases de Tailwind para cada variante de botón, en
// UN SOLO lugar. Antes cada pantalla repetía a mano
// "rounded-full bg-foreground px-4 py-2 text-sm text-background..." — con
// eso, un botón de "Guardar" y uno de "Eliminar" se veían casi IGUAL
// (mismo negro sobre blanco), sin ninguna jerarquía visual clara entre
// "esto es la acción principal" y "esto es peligroso/secundario".
//
// Se exporta como función de clases (no como componente) para que sirva
// TANTO para un <button> real (ver Button.tsx) COMO para un <Link>
// estilizado igual (ver LinkButton.tsx) — los formularios de este proyecto
// usan Server Actions con <form action={...}><button>, así que un botón
// real siempre tiene que seguir siendo un <button> dentro de un <form>,
// nunca un <Link> disfrazado.
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-background focus-visible:ring-primary';

const variants: Record<ButtonVariant, string> = {
  // Acción PRINCIPAL de la pantalla (crear, guardar, matricular...) — el
  // color de marca, para que resalte por encima de todo lo demás.
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  // Acción secundaria (cancelar, ver más, un link con forma de botón) —
  // visible pero sin competir con la principal.
  secondary:
    'border border-border bg-surface text-foreground hover:bg-black/[.03] dark:hover:bg-white/[.06]',
  // Acciones destructivas (eliminar, revocar, retirar) — el único lugar
  // donde el rojo aparece como FONDO de botón, no solo como texto suelto.
  danger: 'bg-danger text-white hover:opacity-90',
  // Para acciones de bajo compromiso dentro de una fila/tabla (ej. "Ver",
  // "Editar" en una lista larga) — no necesitan el peso visual de un botón
  // lleno, pero siguen distinguiéndose de texto plano al pasar el mouse.
  ghost: 'text-primary hover:bg-primary/10 dark:hover:bg-primary/20',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  // Solo para los CTA de la landing pública (ver app/PlatformLanding.tsx) —
  // el resto de la app (formularios, tablas) nunca necesita un botón tan
  // grande.
  lg: 'px-7 py-3.5 text-base',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
): string {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(' ');
}
