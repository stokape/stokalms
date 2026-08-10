// ============================================================================
// Field.tsx — Label + input de texto, ya estilizados (ver field-styles.ts).
// Reemplaza el patrón repetido en decenas de formularios de
// "<label className='text-xs...'>Etiqueta<input className='mt-1...' /></label>".
// ============================================================================

import type { InputHTMLAttributes } from 'react';
import { fieldClasses, labelClasses } from './field-styles';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
}

export function Field({ label, className = '', ...props }: FieldProps) {
  return (
    <label className={className}>
      <span className={labelClasses}>{label}</span>
      <input className={fieldClasses} {...props} />
    </label>
  );
}
