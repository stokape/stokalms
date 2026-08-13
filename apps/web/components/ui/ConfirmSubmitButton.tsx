'use client';

// ============================================================================
// ConfirmSubmitButton.tsx — Client Component A PROPOSITO (mismo criterio
// que BrandingStudio.tsx/IdleSessionGuard.tsx: el resto de la app es Server
// Component + Server Action, esto necesita un dialogo de confirmacion REAL
// del navegador antes de dejar que el <form> se envie).
//
// Sigue siendo un <button type="submit"> normal DENTRO del mismo
// <form action={miServerAction}> de siempre — no cambia el flujo de datos,
// solo intercepta el click: si la persona cancela el "window.confirm(...)",
// "preventDefault()" corta el envio del formulario ahi mismo, antes de que
// llegue al servidor.
//
// Cubre los DOS estilos de boton "peligroso" que ya existian en la app:
//   - pasando "variant"/"size" (como <Button variant="danger">) — arma la
//     clase con buttonClasses(), igual que Button.tsx.
//   - pasando solo "className" (como el link chico "Eliminar"/"Quitar" de
//     una fila de tabla) — se usa la clase tal cual, sin transformarla.
// ============================================================================

import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-styles';

interface ConfirmSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto del window.confirm(...) — SIEMPRE viene del diccionario de la pantalla que llama, nunca hardcodeado aca (este componente es compartido entre paginas en distinto idioma). */
  confirmMessage: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ConfirmSubmitButton({
  confirmMessage,
  variant,
  size = 'md',
  className,
  type = 'submit',
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  }

  return (
    <button
      type={type}
      className={variant ? buttonClasses(variant, size, className) : className}
      onClick={handleClick}
      {...props}
    />
  );
}
