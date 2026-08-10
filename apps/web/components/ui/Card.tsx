// ============================================================================
// Card.tsx — Contenedor con borde/fondo/sombra suave para agrupar una
// sección de una pantalla (un formulario, una tabla, un bloque de
// estadísticas). Antes todo el contenido flotaba directo sobre el fondo,
// sin ninguna separación visual entre "esto es un bloque" y "esto es
// otro" — de ahí la sensación de interfaz "sólida"/plana que se pidió
// mejorar.
// ============================================================================

import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-5 shadow-sm ${className}`}
      {...props}
    />
  );
}
