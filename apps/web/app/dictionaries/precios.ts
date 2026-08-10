// ============================================================================
// dictionaries/precios.ts — Textos de app/precios/ en español e inglés (ver
// lib/locale.ts). Mismo criterio que dictionaries/landing.ts: un objeto
// por idioma, sin motor de traducción — el TEXTO vive aca, los NUMEROS
// (precios, limites, tarifas) viven en lib/pricing.ts. Cada feature/fila
// del comparador se busca por su key (ver FeatureKey en lib/pricing.ts),
// nunca se repite el texto de un plan a otro.
// ============================================================================

import type { Locale } from '@/lib/locale';
import type { FeatureKey } from '@/lib/pricing';

const es = {
  meta: {
    title: 'Planes y precios de Stoka LMS',
    description:
      'Planes de Stoka LMS para empresas, academias e institutos: capacitación y aprendizaje online con precios por usuarios activos mensuales. Compara Starter, Business, Pro y Enterprise.',
  },
  hero: {
    badge: 'Planes y precios',
    title: 'Un plan para cada etapa de tu institución',
    subtitle:
      'Stoka LMS es la plataforma LMS para empresas, academias e institutos que necesitan administrar capacitación y aprendizaje online — paga solo por quienes realmente la usan.',
  },
  billingToggle: {
    monthly: 'Mensual',
    annual: 'Anual',
    annualBadge: 'Ahorra hasta 2 meses',
  },
  plan: {
    monthlySuffix: '/ mes + IGV',
    annualSuffix: '/ año + IGV',
    annualPriceLabel: 'Precio anual',
    savingsPrefix: 'Ahorras',
    savingsSuffix: 'al año',
    activeUsersUpTo: (n: number) => `Hasta ${n} usuarios activos al mes`,
    customUsers: 'Usuarios según necesidad',
    customPrice: 'Precio personalizado',
    customPriceNote: 'Para organizaciones con más de 500 usuarios activos mensuales o necesidades especiales.',
    recommendedBadge: 'Más popular',
    cta: {
      starter: 'Comenzar con Starter',
      business: 'Elegir Business',
      pro: 'Elegir Pro',
      enterprise: 'Contactar con ventas',
    },
  },
  features: {
    unlimitedRegisteredUsers: 'Usuarios registrados ilimitados',
    unlimitedCourses: 'Cursos ilimitados',
    courseManagement: 'Creación y administración de cursos',
    assessments: 'Evaluaciones',
    certificates: 'Certificados',
    fileUploads: 'Carga de PDF, documentos y contenido multimedia',
    basicDashboard: 'Dashboard básico',
    progressTracking: 'Seguimiento del progreso',
    roles: 'Roles de administrador, instructor y alumno',
    standardSupport: 'Soporte estándar',
    customBranding: 'Personalización de marca',
    customCertificates: 'Certificados personalizados',
    advancedReports: 'Reportes avanzados',
    enterpriseDashboard: 'Dashboard empresarial',
    advancedUserManagement: 'Gestión avanzada de usuarios',
    groupManagement: 'Gestión por grupos o áreas',
    automations: 'Automatizaciones',
    reportExport: 'Exportación de reportes',
    prioritySupport: 'Soporte prioritario',
    customDomain: 'Dominio personalizado',
    brandingRemoval: 'Eliminación o personalización avanzada del branding Stoka',
    advancedAnalytics: 'Analítica avanzada',
    advancedAutomations: 'Automatizaciones avanzadas',
    aiFeatures: 'Funcionalidades de IA disponibles en Stoka LMS',
    customReports: 'Reportes personalizados',
    usersAsNeeded: 'Usuarios según necesidad',
    sla: 'SLA',
    dedicatedSupport: 'Soporte dedicado',
    enterpriseOnboarding: 'Onboarding empresarial',
    dataMigration: 'Migración de información',
    customConfiguration: 'Configuración personalizada',
    advancedSecurity: 'Seguridad avanzada',
    enterpriseAnalytics: 'Analítica empresarial',
    specialDeployments: 'Implementaciones especiales',
  } satisfies Record<FeatureKey, string>,
  mau: {
    heading: 'Paga por quienes realmente utilizan Stoka LMS',
    body: 'Stoka LMS factura según usuarios activos mensuales (MAU), no según cuántas cuentas existan en tu institución — puedes registrar a todo tu personal o alumnado sin que eso incremente tu plan.',
    step1: (n: number) => `${n} usuarios registrados`,
    step2: (n: number) => `${n} usuarios utilizaron Stoka LMS este mes`,
    step3: (n: number) => `Solo se contabilizan ${n} usuarios activos`,
    tooltipLabel: 'usuarios activos',
    tooltipBody:
      'Un usuario activo mensual es un usuario único que inicia sesión o realiza una actividad dentro de Stoka LMS durante el período mensual de facturación. Múltiples accesos de la misma persona cuentan como un solo usuario activo.',
  },
  additionalUsers: {
    heading: '¿Necesitas algunos usuarios adicionales?',
    body: 'Si tu institución supera el cupo de usuarios activos de su plan en un mes puntual, no se corta el servicio — el excedente se factura a esta tarifa de referencia por usuario activo adicional.',
    perUserSuffix: 'por usuario activo adicional',
    custom: 'Precio personalizado',
    upgradeRecommendationPrefix: 'Por tu nivel de uso,',
    upgradeRecommendationSuffix: 'podría resultar más conveniente.',
  },
  comparison: {
    heading: 'Compara todos los planes',
    planColumn: 'Plan',
    rows: {
      activeUsers: 'Usuarios activos mensuales',
      registeredUsers: 'Usuarios registrados',
      courses: 'Cursos',
      assessments: 'Evaluaciones',
      certificates: 'Certificados',
      dashboard: 'Dashboard',
      advancedReports: 'Reportes avanzados',
      customBranding: 'Branding personalizado',
      customDomain: 'Dominio personalizado',
      automations: 'Automatizaciones',
      ai: 'IA',
      sla: 'SLA',
      prioritySupport: 'Soporte prioritario',
      dedicatedSupport: 'Soporte dedicado',
    },
    values: {
      unlimited: 'Ilimitados',
      custom: 'Personalizado',
      basic: 'Básico',
      enterprise: 'Empresarial',
    },
  },
  faq: {
    heading: 'Preguntas frecuentes',
    items: [
      {
        question: '¿Qué es un usuario activo mensual?',
        answer:
          'Es un usuario único que inicia sesión o realiza una actividad dentro de Stoka LMS durante el período mensual de facturación. Si la misma persona entra varias veces en el mes, se cuenta una sola vez.',
      },
      {
        question: '¿Puedo tener más usuarios registrados que mi plan?',
        answer:
          'Sí. El límite de cada plan es sobre usuarios activos mensuales, no sobre usuarios registrados — puedes registrar a todo tu personal o alumnado sin costo adicional por eso.',
      },
      {
        question: '¿Qué ocurre si supero el límite de usuarios activos?',
        answer:
          'El servicio no se interrumpe. El excedente de usuarios activos de ese mes se factura a la tarifa de usuario adicional de tu plan (ver la sección "¿Necesitas algunos usuarios adicionales?" más arriba).',
      },
      {
        question: '¿Cómo funcionan los usuarios adicionales?',
        answer:
          'Cuando tu institución usa más usuarios activos que los incluidos en su plan durante un mes, cada usuario activo adicional se factura a la tarifa de referencia de tu plan.',
      },
      {
        question: '¿Puedo cambiar de plan posteriormente?',
        answer:
          'Sí, puedes cambiar de plan cuando tu institución lo necesite. Contacta al equipo de Stoka LMS para coordinar el cambio.',
      },
      {
        question: '¿Puedo cancelar mi suscripción?',
        answer: 'Sí. Contacta al equipo de Stoka LMS para coordinar la cancelación de tu suscripción.',
      },
      {
        question: '¿Qué diferencia existe entre usuarios registrados y usuarios activos?',
        answer:
          'Un usuario registrado es cualquier cuenta creada en tu institución, la use o no. Un usuario activo es quien de verdad inició sesión o hizo alguna actividad en Stoka LMS durante el mes — solo estos últimos se facturan.',
      },
      {
        question: '¿Los precios incluyen IGV?',
        answer: 'No. Todos los precios publicados están expresados sin IGV.',
      },
      {
        question: '¿Qué métodos de pago acepta Stoka LMS?',
        answer:
          'Los métodos de pago disponibles se coordinan directamente con el equipo comercial de Stoka LMS al contratar tu plan.',
      },
    ],
  },
  enterpriseCta: {
    heading: '¿Tu organización tiene más de 500 usuarios activos o necesidades especiales?',
    body: 'Hablemos de SLA, migración de información, seguridad avanzada y todo lo que tu implementación empresarial necesite.',
    cta: 'Contactar con ventas',
  },
  nav: {
    login: 'Iniciar sesión',
    registerCta: 'Inscribe tu institución',
  },
  footer: {
    tagline: 'Stoka LMS — plataforma de gestión de aprendizaje multi-tenant.',
  },
};

const en = {
  meta: {
    title: 'Stoka LMS pricing and plans',
    description:
      'Stoka LMS plans for companies, academies, and institutes: online training and learning management priced by monthly active users. Compare Starter, Business, Pro, and Enterprise.',
  },
  hero: {
    badge: 'Pricing and plans',
    title: 'A plan for every stage of your institution',
    subtitle:
      'Stoka LMS is the LMS platform for companies, academies, and institutes that need to manage training and online learning — pay only for who actually uses it.',
  },
  billingToggle: {
    monthly: 'Monthly',
    annual: 'Annual',
    annualBadge: 'Save up to 2 months',
  },
  plan: {
    monthlySuffix: '/ month + tax',
    annualSuffix: '/ year + tax',
    annualPriceLabel: 'Annual price',
    savingsPrefix: 'You save',
    savingsSuffix: 'a year',
    activeUsersUpTo: (n: number) => `Up to ${n} active users a month`,
    customUsers: 'Users based on your needs',
    customPrice: 'Custom pricing',
    customPriceNote: 'For organizations with more than 500 monthly active users or special requirements.',
    recommendedBadge: 'Most popular',
    cta: {
      starter: 'Start with Starter',
      business: 'Choose Business',
      pro: 'Choose Pro',
      enterprise: 'Contact sales',
    },
  },
  features: {
    unlimitedRegisteredUsers: 'Unlimited registered users',
    unlimitedCourses: 'Unlimited courses',
    courseManagement: 'Course creation and management',
    assessments: 'Assessments',
    certificates: 'Certificates',
    fileUploads: 'PDF, document, and multimedia content uploads',
    basicDashboard: 'Basic dashboard',
    progressTracking: 'Progress tracking',
    roles: 'Administrator, instructor, and student roles',
    standardSupport: 'Standard support',
    customBranding: 'Brand customization',
    customCertificates: 'Custom certificates',
    advancedReports: 'Advanced reports',
    enterpriseDashboard: 'Enterprise dashboard',
    advancedUserManagement: 'Advanced user management',
    groupManagement: 'Group or department management',
    automations: 'Automations',
    reportExport: 'Report exporting',
    prioritySupport: 'Priority support',
    customDomain: 'Custom domain',
    brandingRemoval: 'Advanced Stoka branding removal/customization',
    advancedAnalytics: 'Advanced analytics',
    advancedAutomations: 'Advanced automations',
    aiFeatures: 'AI features available in Stoka LMS',
    customReports: 'Custom reports',
    usersAsNeeded: 'Users based on your needs',
    sla: 'SLA',
    dedicatedSupport: 'Dedicated support',
    enterpriseOnboarding: 'Enterprise onboarding',
    dataMigration: 'Data migration',
    customConfiguration: 'Custom configuration',
    advancedSecurity: 'Advanced security',
    enterpriseAnalytics: 'Enterprise analytics',
    specialDeployments: 'Special deployments',
  } satisfies Record<FeatureKey, string>,
  mau: {
    heading: 'Pay for who actually uses Stoka LMS',
    body: "Stoka LMS bills by monthly active users (MAU), not by how many accounts exist at your institution — register your whole staff or student body without that increasing your plan.",
    step1: (n: number) => `${n} registered users`,
    step2: (n: number) => `${n} users used Stoka LMS this month`,
    step3: (n: number) => `Only ${n} active users are counted`,
    tooltipLabel: 'active users',
    tooltipBody:
      'A monthly active user is a unique user who logs in or performs an activity within Stoka LMS during the monthly billing period. Multiple logins by the same person count as a single active user.',
  },
  additionalUsers: {
    heading: 'Need a few extra users?',
    body: "If your institution goes over its plan's active-user allowance in a given month, service isn't cut off — the overage is billed at this reference rate per additional active user.",
    perUserSuffix: 'per additional active user',
    custom: 'Custom pricing',
    upgradeRecommendationPrefix: 'Based on your usage level,',
    upgradeRecommendationSuffix: 'could be more cost-effective.',
  },
  comparison: {
    heading: 'Compare all plans',
    planColumn: 'Plan',
    rows: {
      activeUsers: 'Monthly active users',
      registeredUsers: 'Registered users',
      courses: 'Courses',
      assessments: 'Assessments',
      certificates: 'Certificates',
      dashboard: 'Dashboard',
      advancedReports: 'Advanced reports',
      customBranding: 'Custom branding',
      customDomain: 'Custom domain',
      automations: 'Automations',
      ai: 'AI',
      sla: 'SLA',
      prioritySupport: 'Priority support',
      dedicatedSupport: 'Dedicated support',
    },
    values: {
      unlimited: 'Unlimited',
      custom: 'Custom',
      basic: 'Basic',
      enterprise: 'Enterprise',
    },
  },
  faq: {
    heading: 'Frequently asked questions',
    items: [
      {
        question: 'What is a monthly active user?',
        answer:
          'It is a unique user who logs in or performs an activity within Stoka LMS during the monthly billing period. If the same person logs in multiple times in a month, it only counts once.',
      },
      {
        question: 'Can I have more registered users than my plan?',
        answer:
          "Yes. Each plan's limit is on monthly active users, not registered users — you can register your entire staff or student body at no extra cost for that.",
      },
      {
        question: 'What happens if I go over my active user limit?',
        answer:
          "Service isn't interrupted. That month's excess active users are billed at your plan's additional-user rate (see the \"Need a few extra users?\" section above).",
      },
      {
        question: 'How do additional users work?',
        answer:
          "When your institution uses more active users than included in its plan during a month, each additional active user is billed at your plan's reference rate.",
      },
      {
        question: 'Can I change plans later?',
        answer: 'Yes, you can change plans whenever your institution needs to. Contact the Stoka LMS team to arrange the change.',
      },
      {
        question: 'Can I cancel my subscription?',
        answer: 'Yes. Contact the Stoka LMS team to arrange cancelling your subscription.',
      },
      {
        question: 'What is the difference between registered users and active users?',
        answer:
          "A registered user is any account created at your institution, whether it's used or not. An active user is someone who actually logged in or did something in Stoka LMS during the month — only these are billed.",
      },
      {
        question: 'Do the prices include tax?',
        answer: 'No. All published prices are shown before tax.',
      },
      {
        question: 'What payment methods does Stoka LMS accept?',
        answer: "Available payment methods are arranged directly with Stoka LMS's sales team when you contract your plan.",
      },
    ],
  },
  enterpriseCta: {
    heading: 'Does your organization have more than 500 active users or special needs?',
    body: "Let's talk about SLAs, data migration, advanced security, and everything your enterprise deployment needs.",
    cta: 'Contact sales',
  },
  nav: {
    login: 'Log in',
    registerCta: 'Register your institution',
  },
  footer: {
    tagline: 'Stoka LMS — multi-tenant learning management platform.',
  },
};

const dictionaries = { es, en };

export type PreciosDictionary = typeof es;

export function getPreciosDictionary(locale: Locale): PreciosDictionary {
  return dictionaries[locale];
}
