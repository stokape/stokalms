// ============================================================================
// lib/pricing.ts — FUENTE UNICA de la configuracion comercial de Stoka LMS
// (planes, precios, limites de usuarios activos, tarifas de usuario
// adicional, filas del comparador). Ningun componente de app/precios/
// hardcodea un numero: todos leen de aca.
//
// POR QUE UN MODULO DE lib/ Y NO UNA TABLA EN LA BASE DE DATOS: hoy Stoka
// LMS no tiene ningun modelo de "Plan"/"Subscription"/"Billing" (ver
// apps/api/prisma/schema.prisma) — no hay todavia un sistema de
// suscripciones real al que conectarse. Modelarlo en un modulo TypeScript
// tipado, con una unica funcion de acceso (getPricingPlans), dice
// exactamente lo mismo que diria un "GET /billing/plans" del backend el
// dia que exista: en ese momento, esta funcion pasa a hacer un fetch en
// vez de devolver un array literal, y NINGUN componente de la UI necesita
// cambiar (siguen llamando a getPricingPlans()/getComparisonRows()).
//
// Los PRECIOS y LIMITES son los mismos en cualquier idioma (soles, cupos
// de usuarios) — por eso viven aca, no en dictionaries/precios.ts (que
// solo tiene TEXTO). Cada feature se referencia por una KEY (ej.
// "unlimitedCourses"), nunca por su texto — el texto de cada key vive en
// el diccionario, mismo patron que FEATURE_KEYS en dictionaries/landing.ts.
// ============================================================================

export type PlanId = 'starter' | 'business' | 'pro' | 'enterprise';

export type BillingPeriod = 'monthly' | 'annual';

// Union CERRADA de features posibles en toda la matriz de planes — cada
// plan solo referencia las suyas (ver PLAN_FEATURE_KEYS abajo). El texto de
// cada una vive en dictionaries/precios.ts, indexado por esta misma key.
export const FEATURE_KEYS = [
  // --- Starter (base) ---
  'unlimitedRegisteredUsers',
  'unlimitedCourses',
  'courseManagement',
  'assessments',
  'certificates',
  'fileUploads',
  'basicDashboard',
  'progressTracking',
  'roles',
  'standardSupport',
  // --- Business (adicional sobre Starter) ---
  'customBranding',
  'customCertificates',
  'advancedReports',
  'enterpriseDashboard',
  'advancedUserManagement',
  'groupManagement',
  'automations',
  'reportExport',
  'prioritySupport',
  // --- Pro (adicional sobre Business) ---
  'customDomain',
  'brandingRemoval',
  'advancedAnalytics',
  'advancedAutomations',
  'aiFeatures',
  'customReports',
  // --- Enterprise (lista propia, no acumulada) ---
  'usersAsNeeded',
  'sla',
  'dedicatedSupport',
  'enterpriseOnboarding',
  'dataMigration',
  'customConfiguration',
  'advancedSecurity',
  'enterpriseAnalytics',
  'specialDeployments',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

const STARTER_FEATURES: FeatureKey[] = [
  'unlimitedRegisteredUsers',
  'unlimitedCourses',
  'courseManagement',
  'assessments',
  'certificates',
  'fileUploads',
  'basicDashboard',
  'progressTracking',
  'roles',
  'standardSupport',
];

const BUSINESS_ADDITIONAL_FEATURES: FeatureKey[] = [
  'customBranding',
  'customCertificates',
  'advancedReports',
  'enterpriseDashboard',
  'advancedUserManagement',
  'groupManagement',
  'automations',
  'reportExport',
  'prioritySupport',
];

const PRO_ADDITIONAL_FEATURES: FeatureKey[] = [
  'customDomain',
  'brandingRemoval',
  'advancedAnalytics',
  'advancedAutomations',
  'aiFeatures',
  'customReports',
];

// Enterprise no se describe como "todo Pro + esto" (a diferencia de
// Business/Pro) — el brief comercial le da su propia lista cerrada, asi
// que no se acumula sobre las anteriores.
const ENTERPRISE_FEATURES: FeatureKey[] = [
  'usersAsNeeded',
  'sla',
  'dedicatedSupport',
  'enterpriseOnboarding',
  'dataMigration',
  'customConfiguration',
  'advancedSecurity',
  'enterpriseAnalytics',
  'specialDeployments',
];

// Como se llega al CTA de cada plan HOY (ver app/precios/actions.ts). Los
// primeros tres reusan el flujo YA EXISTENTE de alta de institucion (ver
// app/registro-institucion/) — es, literalmente, "crear la organizacion"
// (el tercer paso del flujo de suscripcion descripto en el brief), solo
// que hoy la aprueba un humano en vez de un pago automatico. "contactSales"
// apunta al mismo formulario, con el plan Enterprise preseleccionado en el
// mensaje. El dia que exista un checkout de pago real, un plan nuevo
// ("checkout") se agrega aca y CADA CTA se resuelve distinto sin tocar
// ningun componente visual — ver resolvePlanCtaHref().
export type PlanCtaAction = 'register' | 'contactSales';

export interface PricingPlan {
  planId: PlanId;
  /** "Starter"/"Business"/"Pro"/"Enterprise" — nombre propio, no se traduce. */
  name: string;
  /** Precio mensual en soles (PEN), sin IGV. "null" = precio personalizado (Enterprise). */
  monthlyPrice: number | null;
  /** Precio anual total en soles (PEN), sin IGV. "null" = precio personalizado. */
  annualPrice: number | null;
  /** Tope de usuarios activos mensuales (MAU) incluidos. "null" = "segun necesidad". */
  activeUsers: number | null;
  /** Tarifa por usuario activo adicional, en soles. "null" = precio personalizado. */
  additionalUserPrice: number | null;
  /** Features que se listan en la tarjeta, en el orden en que se muestran. */
  features: FeatureKey[];
  /** Plan destacado visualmente ("Mas popular"). Solo uno deberia ser "true". */
  recommended: boolean;
  ctaAction: PlanCtaAction;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    planId: 'starter',
    name: 'Starter',
    monthlyPrice: 199,
    annualPrice: 1990,
    activeUsers: 50,
    additionalUserPrice: 4,
    features: STARTER_FEATURES,
    recommended: false,
    ctaAction: 'register',
  },
  {
    planId: 'business',
    name: 'Business',
    monthlyPrice: 499,
    annualPrice: 4990,
    activeUsers: 200,
    additionalUserPrice: 2.5,
    features: [...STARTER_FEATURES, ...BUSINESS_ADDITIONAL_FEATURES],
    recommended: true,
    ctaAction: 'register',
  },
  {
    planId: 'pro',
    name: 'Pro',
    monthlyPrice: 899,
    annualPrice: 8990,
    activeUsers: 500,
    additionalUserPrice: 1.8,
    features: [...STARTER_FEATURES, ...BUSINESS_ADDITIONAL_FEATURES, ...PRO_ADDITIONAL_FEATURES],
    recommended: false,
    ctaAction: 'register',
  },
  {
    planId: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    activeUsers: null,
    additionalUserPrice: null,
    features: ENTERPRISE_FEATURES,
    recommended: false,
    ctaAction: 'contactSales',
  },
];

/** Version async a proposito (ver la nota grande al inicio del archivo):
 * el dia que esto pase a ser un fetch a un backend de billing real, ningun
 * llamador (todos usan "await") necesita cambiar una linea. */
export async function getPricingPlans(): Promise<PricingPlan[]> {
  return PRICING_PLANS;
}

export function getPricingPlan(planId: PlanId): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.planId === planId);
}

/** Ahorro anual DERIVADO (nunca un numero suelto guardado aparte que se
 * pueda desincronizar del precio real) — "null" si el plan no tiene
 * precio fijo (Enterprise). */
export function getAnnualSaving(plan: PricingPlan): number | null {
  if (plan.monthlyPrice === null || plan.annualPrice === null) return null;
  return plan.monthlyPrice * 12 - plan.annualPrice;
}

export function getPriceForPeriod(plan: PricingPlan, period: BillingPeriod): number | null {
  return period === 'annual' ? plan.annualPrice : plan.monthlyPrice;
}

// "S/ 1,990" — precios de plan: siempre numeros enteros, separador de
// miles con coma. Formato fijo en soles peruanos (PEN): Stoka LMS opera en
// Peru, no depende del idioma de la interfaz.
export function formatPEN(amount: number): string {
  return `S/ ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

// "S/ 4.00" / "S/ 1.80" — tarifas de usuario adicional: siempre 2
// decimales, para que "S/ 1.8" nunca se lea como un precio a medio
// redondear.
export function formatPENDecimal(amount: number): string {
  return `S/ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// --- Comparador de planes ---------------------------------------------

// Fila del comparador: un valor de texto (ej. "Ilimitados"), un limite
// numerico (ej. usuarios activos) o disponible/no disponible (check o
// guion) — ver PlanComparison.tsx, que sabe renderizar los tres casos.
export type ComparisonValue = boolean | string;

export interface ComparisonRow {
  key: string;
  values: Record<PlanId, ComparisonValue>;
}

// Filas sugeridas por el brief comercial. El limite de usuarios activos se
// TOMA de PRICING_PLANS (nunca un numero repetido a mano) para que no se
// pueda desincronizar del limite real de cada plan.
const [starter, business, pro] = PRICING_PLANS;

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    key: 'activeUsers',
    values: {
      starter: String(starter.activeUsers),
      business: String(business.activeUsers),
      pro: String(pro.activeUsers),
      enterprise: 'custom',
    },
  },
  {
    key: 'registeredUsers',
    values: { starter: 'unlimited', business: 'unlimited', pro: 'unlimited', enterprise: 'unlimited' },
  },
  { key: 'courses', values: { starter: 'unlimited', business: 'unlimited', pro: 'unlimited', enterprise: 'unlimited' } },
  { key: 'assessments', values: { starter: true, business: true, pro: true, enterprise: true } },
  { key: 'certificates', values: { starter: true, business: true, pro: true, enterprise: true } },
  { key: 'dashboard', values: { starter: 'basic', business: 'enterprise', pro: 'enterprise', enterprise: 'enterprise' } },
  { key: 'advancedReports', values: { starter: false, business: true, pro: true, enterprise: true } },
  { key: 'customBranding', values: { starter: false, business: true, pro: true, enterprise: true } },
  { key: 'customDomain', values: { starter: false, business: false, pro: true, enterprise: true } },
  { key: 'automations', values: { starter: false, business: true, pro: true, enterprise: true } },
  { key: 'ai', values: { starter: false, business: false, pro: true, enterprise: true } },
  { key: 'sla', values: { starter: false, business: false, pro: false, enterprise: true } },
  { key: 'prioritySupport', values: { starter: false, business: true, pro: true, enterprise: true } },
  { key: 'dedicatedSupport', values: { starter: false, business: false, pro: false, enterprise: true } },
];

export async function getComparisonRows(): Promise<ComparisonRow[]> {
  return COMPARISON_ROWS;
}

// --- Usuarios adicionales ------------------------------------------------

export async function getAdditionalUserPrices(): Promise<PricingPlan[]> {
  return PRICING_PLANS;
}

// --- Recomendacion de upgrade (preparado, no conectado todavia) ---------
//
// Stoka LMS todavia no mide el consumo real de usuarios activos por tenant
// en ningun lugar accesible desde el frontend (no hay endpoint de "MAU de
// este mes" — ver docs/architecture/06-roadmap.md). Esta funcion queda
// lista para el dia que exista: dado el plan actual y cuantos usuarios
// activos adicionales se estan pagando de mas, calcula si el SIGUIENTE
// plan saldria mas barato en total — la misma cuenta que haria a mano
// alguien de ventas. Ver app/precios/UpgradeRecommendation.tsx (usa esta
// funcion) y AdditionalUsers.tsx (documenta donde se conectaria).
export function getRecommendedUpgrade(
  currentPlanId: PlanId,
  extraActiveUsers: number,
): { plan: PricingPlan; monthlySavings: number } | null {
  const currentIndex = PRICING_PLANS.findIndex((p) => p.planId === currentPlanId);
  const current = PRICING_PLANS[currentIndex];
  const next = PRICING_PLANS[currentIndex + 1];
  if (!current || !next || current.monthlyPrice === null || next.monthlyPrice === null) {
    return null;
  }
  if (extraActiveUsers <= 0 || current.additionalUserPrice === null) return null;

  const currentTotal = current.monthlyPrice + extraActiveUsers * current.additionalUserPrice;
  const monthlySavings = currentTotal - next.monthlyPrice;
  return monthlySavings > 0 ? { plan: next, monthlySavings } : null;
}
