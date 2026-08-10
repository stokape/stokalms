// ============================================================================
// analytics.ts — Grabar eventos del embudo de incorporacion (onboarding).
// SIEMPRE desde el servidor (Server Components/Actions/Route Handlers) —
// nunca hay un script en el navegador de quien visita, nada de cookies de
// terceros ni IP/user-agent guardados. Ver apps/api/src/modules/analytics/
// (el backend real) y admin-plataforma/metricas/page.tsx (donde se ve el
// resumen).
//
// "trackEvent" nunca debe poder romper la pantalla que lo llama: si el
// backend esta caido o tarda, la persona sigue viendo su landing/login
// normal — perder una fila de metricas es aceptable, perder una pantalla
// entera por eso no. Mismo criterio que "getPermissions" en lib/api.ts
// (atrapa y sigue en vez de dejar que un fallo secundario tumbe todo).
// ============================================================================

// Lista CERRADA de eventos validos — debe reflejar EXACTO
// "ANALYTICS_EVENTS" en apps/api/.../create-analytics-event.dto.ts (no hay
// paquete compartido entre back y front en este monorepo).
export type AnalyticsEventName =
  | 'landing_view'
  | 'entrar_search'
  | 'login_started'
  | 'login_completed'
  | 'registration_submitted'
  // --- Embudo de Planes y precios (ver app/precios/) ---
  | 'pricing_view'
  | 'billing_period_changed'
  | 'plan_selected'
  | 'enterprise_contact_clicked'
  | 'pricing_faq_opened';

const API_URL = process.env.STOKA_API_URL ?? 'http://localhost:3001/api/v1';

export async function trackEvent(
  event: AnalyticsEventName,
  options: { host?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    await fetch(`${API_URL}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, host: options.host, metadata: options.metadata }),
      cache: 'no-store',
    });
  } catch {
    // Ver la nota grande de arriba: un evento perdido no es motivo para
    // que nadie vea un error.
  }
}
