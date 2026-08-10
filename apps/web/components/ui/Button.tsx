// ============================================================================
// Button.tsx — <button> real (para ir DENTRO de <form action={...}>, el
// patrón de Server Actions que usa toda la app) con las variantes de
// button-styles.ts. Ver LinkButton.tsx para el equivalente que navega en
// vez de enviar un formulario.
// ============================================================================

import type { ButtonHTMLAttributes } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-styles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'submit',
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...props} />
  );
}
