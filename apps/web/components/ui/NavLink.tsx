'use client';

// ============================================================================
// NavLink.tsx — Enlace del menú lateral que se resalta solo cuando es la
// pantalla activa (usePathname obliga a que este sea un Client Component
// puntual — el resto del layout sigue siendo Server Component). Antes
// NINGÚN enlace del menú indicaba "estás aquí": había que fijarse en el
// título de la página para saber dónde estabas parado.
// ============================================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = href === '/cursos' ? pathname === '/cursos' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted hover:bg-black/[.04] hover:text-foreground dark:hover:bg-white/[.06]'
      }`}
    >
      <span className={active ? 'text-primary' : 'text-muted'}>{icon}</span>
      {children}
    </Link>
  );
}
