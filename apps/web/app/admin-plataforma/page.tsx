// ============================================================================
// admin-plataforma/page.tsx — Punto de entrada al panel de administración
// de plataforma. A PROPÓSITO no hay ningún link público que apunte aquí
// (ver la nota en PlatformLanding.tsx, Footer) — quien necesita entrar
// tiene que conocer/guardar esta URL directamente. Es higiene de
// descubrimiento, no la protección real: esa sigue siendo
// PlatformAdminGuard/PLATFORM_ADMIN_EMAILS del lado del backend — cualquier
// cuenta que NO esté en esa lista ve el mismo 403 de siempre en
// /admin-plataforma/solicitudes aunque encuentre esta URL.
// ============================================================================

import { auth, signIn } from '@/auth';
import { LinkButton } from '@/components/ui/LinkButton';
import { Button } from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';
import { getLocale } from '@/lib/locale';

const TEXT = {
  es: {
    loggedInAs: 'Ya iniciaste sesión como',
    goToPanel: 'Ir al panel',
    title: 'Acceso de administración',
    subtitle: 'Solo para el equipo de Stoka LMS.',
    login: 'Iniciar sesión',
  },
  en: {
    loggedInAs: "You're already logged in as",
    goToPanel: 'Go to panel',
    title: 'Administration access',
    subtitle: 'Only for the Stoka LMS team.',
    login: 'Log in',
  },
};

export default async function AdminPlataformaGatewayPage() {
  const [rawSession, t] = await Promise.all([auth(), getLocale().then((l) => TEXT[l])]);

  // "session.error" = refresh_token vencido/invalidado (ver la nota
  // extensa en app/page.tsx) — sin este filtro, "Ir al panel" rebotaria
  // sin fin entre aca y "/" (requireAccessToken en solicitudes/page.tsx
  // detecta el mismo error y redirige a "/", que redirige aca de nuevo).
  const session = rawSession?.error ? null : rawSession;

  if (session) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="mb-4 text-sm text-muted">
          {t.loggedInAs}{' '}
          <strong className="text-foreground">{session.user?.email ?? session.user?.name}</strong>.
        </p>
        <LinkButton href="/admin-plataforma/solicitudes">{t.goToPanel}</LinkButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="mb-2 text-xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mb-6 text-sm text-muted">{t.subtitle}</p>
      <form
        action={async () => {
          'use server';
          void trackEvent('login_started', { metadata: { flow: 'platform_admin' } });
          await signIn('keycloak', { redirectTo: '/admin-plataforma/solicitudes' });
        }}
      >
        <Button type="submit">{t.login}</Button>
      </form>
    </div>
  );
}
