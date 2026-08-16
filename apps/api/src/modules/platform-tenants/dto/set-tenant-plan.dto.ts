// ============================================================================
// set-tenant-plan.dto.ts — Body de "PATCH /platform/tenants/:tenantId/plan".
//
// Solo un Administrador de PLATAFORMA puede asignar el plan comercial de
// una institucion (ver PlatformAdminGuard en platform-tenants.controller.ts,
// aplicado a nivel de TODO el controller) — ninguna institucion puede
// autoasignarse un plan mejor desde su propio panel.
//
// Los 4 valores validos son los mismos IDs que usa la pagina de precios
// (ver apps/web/lib/pricing.ts, "PlanId") — mantenerlos sincronizados a
// mano es un costo bajo hoy (4 valores, cambian poco) frente a la
// alternativa de compartir un paquete de tipos entre api/web para esto
// solo.
// ============================================================================

import { IsIn } from 'class-validator';

export const TENANT_PLAN_IDS = ['starter', 'business', 'pro', 'enterprise'] as const;

export class SetTenantPlanDto {
  @IsIn(TENANT_PLAN_IDS)
  plan: (typeof TENANT_PLAN_IDS)[number];
}
