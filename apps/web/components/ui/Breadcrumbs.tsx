// ============================================================================
// Breadcrumbs.tsx — El camino completo hasta esta pantalla (ej. "Cursos ›
// Matemática Básica › Contenido › Módulo 1 › Lección 3"), no solo el "←
// Volver" a un único nivel de arriba que tenían antes las pantallas más
// anidadas (curso > módulo > lección, curso > sección > matrícula >
// sustento...) — con 3+ niveles de profundidad, un solo "volver" no dice
// DÓNDE está uno parado, solo de dónde vino.
//
// El ÚLTIMO item nunca es un link (es la pantalla actual — no tiene
// sentido navegar a donde ya se está) y lleva "aria-current=page" para
// quien usa lector de pantalla.
// ============================================================================

import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-muted">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden className="text-border">/</span>}
            {item.href && !isLast ? (
              <Link href={item.href} className="max-w-[12rem] truncate hover:text-foreground hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current={isLast ? 'page' : undefined} className="max-w-[14rem] truncate text-foreground">
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
