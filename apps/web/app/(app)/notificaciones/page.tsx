// ============================================================================
// notificaciones/page.tsx — "Notificaciones": las últimas 30 que le
// llegaron a ESTA persona (ver notification.service.ts, findMine) — nunca
// las de otra persona del tenant, ni siquiera para un Administrador (mismo
// criterio de autoservicio que mis-matriculas/page.tsx). Se llega aca desde
// la campana del header (ver ../layout.tsx, NotificationBell.tsx).
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { BellIcon } from '@/components/ui/icons';
import { getLocale } from '@/lib/locale';
import { marcarLeidaYIr, marcarTodasLeidas } from './actions';

const TEXT = {
  es: {
    title: 'Notificaciones',
    description: 'Avisos recientes dirigidos a vos.',
    empty: 'No tenés ninguna notificación todavía.',
    emptyDescription: 'Cuando pase algo que te involucre (te asignen un rol, se emita un certificado tuyo), va a aparecer acá.',
    markAllRead: 'Marcar todas como leídas',
    unread: 'Sin leer',
  },
  en: {
    title: 'Notifications',
    description: 'Recent updates addressed to you.',
    empty: "You don't have any notifications yet.",
    emptyDescription: 'When something involving you happens (a role is assigned, one of your certificates is issued), it will show up here.',
    markAllRead: 'Mark all as read',
    unread: 'Unread',
  },
};

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default async function NotificacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];

  let notifications: Notification[];
  try {
    notifications = await apiFetch<Notification[]>(token, '/notifications');
  } catch (err) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorBanner message={toErrorMessage(err)} />
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          hasUnread && (
            <form action={marcarTodasLeidas}>
              <Button type="submit" variant="secondary" size="sm">
                {t.markAllRead}
              </Button>
            </form>
          )
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState icon={BellIcon} title={t.empty} description={t.emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={n.read ? 'px-4 py-3.5' : 'bg-primary/[.04] px-4 py-3.5'}
              >
                <form action={marcarLeidaYIr.bind(null, n.id, n.link)}>
                  <button type="submit" className="block w-full text-left">
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                          aria-label={t.unread}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={n.read ? 'text-sm text-foreground' : 'text-sm font-semibold text-foreground'}>
                          {n.title}
                        </p>
                        {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                        <p className="mt-1 text-xs text-muted">
                          {new Date(n.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
