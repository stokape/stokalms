// ============================================================================
// LinkButton.tsx — Un <Link> de Next.js con la MISMA forma que Button.tsx,
// para navegación ("Crear curso", "Ver detalle") en vez de envío de
// formulario. Nunca reemplaza a Button dentro de un <form> real.
// ============================================================================

import Link, { type LinkProps } from 'next/link';
import type { AnchorHTMLAttributes } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-styles';

interface LinkButtonProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: LinkButtonProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
