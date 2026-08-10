// ============================================================================
// create-analytics-event.dto.ts — Body de "POST /analytics/events". Lista
// CERRADA de eventos validos (no texto libre): evita que un request mal
// formado o un intento de abuso llene la tabla con nombres inventados que
// despues nadie sabe interpretar en el panel de metricas. Debe reflejar
// EXACTAMENTE los mismos valores que "AnalyticsEventName" en
// apps/web/lib/analytics.ts -- no hay un paquete compartido entre back y
// front en este monorepo (ver la nota en ese archivo), asi que se
// mantienen sincronizados a mano, cada uno con un comentario que apunta al
// otro.
// ============================================================================

import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export const ANALYTICS_EVENTS = [
  // Alguien vio la landing de LA PLATAFORMA (sin tenant resuelto).
  'landing_view',
  // Alguien busco su institucion en /entrar — "metadata.found" (boolean)
  // distingue si la encontro o no, sin guardar el texto que escribio.
  'entrar_search',
  // Alguien hizo clic en "Iniciar sesion" (institucion) o "Acceso de
  // administracion" (plataforma) — "metadata.flow" distingue cual.
  'login_started',
  // Keycloak devolvio el codigo y el intercambio de token salio bien (ver
  // app/api/auth/[...nextauth]/route.ts) — el login se completo de verdad,
  // no solo se inicio.
  'login_completed',
  // Se envio el formulario publico de alta de institucion.
  'registration_submitted',
  // --- Embudo de Planes y precios (ver apps/web/app/precios/) ---
  // Alguien vio la pagina de precios.
  'pricing_view',
  // Cambio el selector Mensual/Anual — "metadata.period" ('monthly'|'annual').
  'billing_period_changed',
  // Hizo clic en el CTA de un plan de pago (Starter/Business/Pro) —
  // "metadata.planId" y "metadata.billingPeriod".
  'plan_selected',
  // Hizo clic en "Contactar con ventas" (plan Enterprise).
  'enterprise_contact_clicked',
  // Abrio una pregunta del acordeon de FAQ — "metadata.question".
  'pricing_faq_opened',
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[number];

export class CreateAnalyticsEventDto {
  @IsIn(ANALYTICS_EVENTS)
  event: AnalyticsEventType;

  // Dominio desde el que se disparo (ej. "sanmartin.localhost") — nunca la
  // URL completa, para no guardar de mas.
  @IsOptional()
  @IsString()
  @MaxLength(255)
  host?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
