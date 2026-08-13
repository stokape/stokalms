// ============================================================================
// NotificationBell.tsx — Campana en la barra de navegación (ver
// (app)/layout.tsx, donde se usa en el header de escritorio Y el de
// mobile). Server Component puro: recibe el conteo de no leídas YA
// calculado por el layout (mismo criterio que "me"/"tenantInfo" — un solo
// "GET /notifications/unread-count" por carga de página, no uno por
// componente) y solo dibuja el ícono + la pastilla, sin ninguna línea de
// JavaScript — el "tiempo real" de esta campana es "se actualiza en la
// próxima navegación", una simplificación deliberada del MVP (ver la nota
// extensa en notification.service.ts).
// ============================================================================

import Link from 'next/link';
import { BellIcon } from './ui/icons';

export function NotificationBell({ count, label }: { count: number; label: string }) {
  return (
    <Link
      href="/notificaciones"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-black/[.03] hover:text-foreground dark:hover:bg-white/[.06]"
      aria-label={count > 0 ? `${label} (${count})` : label}
    >
      <BellIcon className="h-5 w-5" />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
