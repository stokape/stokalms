// ============================================================================
// dictionaries/landing.ts — Textos de PlatformLanding.tsx en español e
// inglés (ver lib/locale.ts). Un solo objeto por idioma, no un motor de
// traducción: alcanza para 2 idiomas y 1 página, y evita sumar una
// dependencia nueva (next-intl, etc.) para un caso este acotado — mismo
// criterio ya usado en certificate-renderer.service.ts para no sumar un
// motor de plantillas por 5 campos.
// ============================================================================

import type { Locale } from '@/lib/locale';

const FEATURE_KEYS = [
  'courses',
  'enrollments',
  'grades',
  'certificates',
  'roles',
  'branding',
  'attendance',
  'isolation',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export { FEATURE_KEYS };

const es = {
  nav: {
    // Este enlace SOLO aparece con sesión activa en el dominio RAÍZ (sin
    // ninguna institución resuelta, ver PlatformLanding.tsx) — a diferencia
    // de la institución (que vive en su propio subdominio, ver
    // InstitutionHome.tsx), lo único que tiene sentido para esa sesión
    // aquí es el panel de administración de plataforma.
    enterPlatform: 'Panel de administración',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    registerCta: 'Inscribe tu institución',
    pricing: 'Precios',
  },
  hero: {
    badge: 'Plataforma de gestión de aprendizaje multi-tenant',
    titlePrefix: 'La plataforma de aprendizaje que tu institución puede hacer',
    titleHighlight: 'completamente suya',
    subtitle:
      'Cursos, matrículas, evaluaciones y certificados verificables — con tu logo, tus colores y hasta tu propio dominio. Cada institución vive aislada de verdad: sus propios datos, sus propios roles, su propia identidad.',
    ctaRegister: 'Inscribe tu institución',
    ctaLogin: 'Iniciar sesión',
    ctaEnter: 'Ir al panel de administración',
    approvalNote:
      'Cada institución nueva la revisa manualmente el equipo de la plataforma antes de activarse.',
    mosaicCaption: 'Cada institución, con su propio logo, color y dominio.',
  },
  features: {
    heading: 'Todo lo que una institución necesita para dictar y hacer seguimiento de sus cursos',
    items: {
      courses: {
        title: 'Cursos con estructura real',
        description:
          'Periodos académicos, cursos, secciones, módulos y lecciones — con video, PDF, enlaces y más como recursos.',
      },
      enrollments: {
        title: 'Matrículas simples o masivas',
        description: 'Una por una o por lote, con el sustento documental adjunto a cada una.',
      },
      grades: {
        title: 'Evaluaciones y notas',
        description: 'Escalas de calificación y categorías de gradebook configurables por institución.',
      },
      certificates: {
        title: 'Certificados verificables',
        description:
          'Plantillas de diseño propio, con código QR y una página pública de verificación sin necesidad de iniciar sesión.',
      },
      roles: {
        title: 'Roles y permisos a medida',
        description:
          'Super Admin, Administrador, Coordinador, Docente, Estudiante, Apoderado — cada acción permitida se decide permiso por permiso.',
      },
      branding: {
        title: 'Marca y dominio propios',
        description:
          'Tu logo, tus colores, tu fondo — y hasta tu propio dominio (campus.tuinstitucion.com), con verificación automática.',
      },
      attendance: {
        title: 'Asistencia y seguimiento',
        description: 'Registro de asistencia y anotaciones de desempeño, curso por curso, alumno por alumno.',
      },
      isolation: {
        title: 'Aislamiento real entre instituciones',
        description:
          'Cada institución tiene sus datos separados a nivel de base de datos, no solo un filtro dentro de la aplicación.',
      },
    } satisfies Record<FeatureKey, { title: string; description: string }>,
  },
  audiences: {
    heading: 'Pensado para',
    items: ['Institutos', 'Universidades', 'Centros de capacitación', 'Academias'],
  },
  ctaBand: {
    heading: '¿Tu institución todavía no está en Stoka LMS?',
    body: 'Completa el formulario de inscripción — un administrador de la plataforma revisa cada solicitud y te contacta con la respuesta.',
    cta: 'Inscribe tu institución',
  },
  footer: {
    tagline: 'Stoka LMS — plataforma de gestión de aprendizaje multi-tenant.',
    login: 'Iniciar sesión',
  },
};

const en = {
  nav: {
    enterPlatform: 'Admin panel',
    logout: 'Log out',
    login: 'Log in',
    registerCta: 'Register your institution',
    pricing: 'Pricing',
  },
  hero: {
    badge: 'Multi-tenant learning management platform',
    titlePrefix: 'The learning platform your institution can make',
    titleHighlight: 'completely its own',
    subtitle:
      'Courses, enrollments, assessments, and verifiable certificates — with your logo, your colors, and even your own domain. Every institution is truly isolated: its own data, its own roles, its own identity.',
    ctaRegister: 'Register your institution',
    ctaLogin: 'Log in',
    ctaEnter: 'Go to admin panel',
    approvalNote: 'Every new institution is reviewed manually by the platform team before activation.',
    mosaicCaption: 'Every institution, with its own logo, color, and domain.',
  },
  features: {
    heading: 'Everything an institution needs to teach and track its courses',
    items: {
      courses: {
        title: 'Courses with real structure',
        description:
          'Academic terms, courses, sections, modules, and lessons — with video, PDF, links, and more as resources.',
      },
      enrollments: {
        title: 'Simple or bulk enrollments',
        description: 'One at a time or by batch, with supporting documents attached to each one.',
      },
      grades: {
        title: 'Assessments and grades',
        description: 'Grading scales and gradebook categories configurable per institution.',
      },
      certificates: {
        title: 'Verifiable certificates',
        description:
          'Custom-designed templates, with a QR code and a public verification page that needs no login.',
      },
      roles: {
        title: 'Roles and permissions that fit',
        description:
          'Super Admin, Administrator, Coordinator, Teacher, Student, Guardian — every allowed action is decided permission by permission.',
      },
      branding: {
        title: 'Your own branding and domain',
        description:
          'Your logo, your colors, your background — and even your own domain (campus.yourinstitution.edu), with automatic verification.',
      },
      attendance: {
        title: 'Attendance and tracking',
        description: 'Attendance records and performance notes, course by course, student by student.',
      },
      isolation: {
        title: 'Real isolation between institutions',
        description:
          'Each institution has its data separated at the database level, not just a filter inside the application.',
      },
    } satisfies Record<FeatureKey, { title: string; description: string }>,
  },
  audiences: {
    heading: 'Built for',
    items: ['Institutes', 'Universities', 'Training centers', 'Academies'],
  },
  ctaBand: {
    heading: 'Is your institution not on Stoka LMS yet?',
    body: 'Fill out the registration form — a platform administrator reviews every request and gets back to you.',
    cta: 'Register your institution',
  },
  footer: {
    tagline: 'Stoka LMS — multi-tenant learning management platform.',
    login: 'Log in',
  },
};

const dictionaries = { es, en };

export type LandingDictionary = typeof es;

export function getLandingDictionary(locale: Locale): LandingDictionary {
  return dictionaries[locale];
}
