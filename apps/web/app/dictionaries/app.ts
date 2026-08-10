// ============================================================================
// dictionaries/app.ts — Textos COMPARTIDOS del área logueada: la barra de
// navegación (ver (app)/layout.tsx) y el vocabulario común que reutiliza
// casi cualquier pantalla de negocio (botones, estados, mensajes
// genéricos). Cada pantalla que necesita SU PROPIO texto adicional trae
// su propio diccionario (ver dictionaries/cursos.ts, etc.) — este archivo
// es la base que todos comparten, para no repetir "Guardar"/"Cancelar"/
// "Editar" en 30 archivos distintos. Mismo patrón que dictionaries/landing.ts.
// ============================================================================

import type { Locale } from '@/lib/locale';

const es = {
  nav: {
    courses: 'Cursos',
    panel: 'Panel',
    terms: 'Periodos académicos',
    grades: 'Notas',
    reports: 'Reportes',
    cohorts: 'Cohortes',
    automations: 'Automatizaciones',
    security: 'Seguridad',
    myEnrollments: 'Mis matrículas',
    myCertificates: 'Mis certificados',
    certificateTemplates: 'Plantillas de certificado',
    branding: 'Configuración de marca',
    domains: 'Dominios',
    maintenance: 'Mantenimiento',
    users: 'Usuarios y roles',
    profile: 'Mi perfil',
    logout: 'Cerrar sesión',
    openMenu: 'Abrir menú',
    defaultUserLabel: 'Tu cuenta',
  },
  maintenanceBanner: {
    message: 'Modo mantenimiento activo — el resto de las personas no puede entrar a la plataforma.',
    disable: 'Desactivarlo',
  },
  // Sello "Hecho con Stoka LMS" (ver StokaBrandingBadge.tsx) — se puede
  // ocultar desde /configuracion-marca (plan Pro, ver lib/pricing.ts).
  footer: {
    poweredBy: 'Hecho con Stoka LMS',
  },
  // Vocabulario comun reusado por muchas pantallas — ver la nota de arriba.
  common: {
    save: 'Guardar',
    saveChanges: 'Guardar cambios',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    remove: 'Quitar',
    create: 'Crear',
    add: 'Agregar',
    back: 'Volver',
    continue: 'Continuar',
    close: 'Cerrar',
    confirm: 'Confirmar',
    send: 'Enviar',
    download: 'Descargar',
    upload: 'Subir',
    view: 'Ver',
    search: 'Buscar',
    loading: 'Cargando…',
    noPermission: 'No tienes permiso para ver esta pantalla.',
    optional: '(opcional)',
    yes: 'Sí',
    no: 'No',
    active: 'Activo',
    inactive: 'Inactivo',
    status: 'Estado',
    name: 'Nombre',
    email: 'Email',
    date: 'Fecha',
    actions: 'Acciones',
    done: 'Listo.',
  },
} satisfies Record<string, Record<string, string>>;

const en = {
  nav: {
    courses: 'Courses',
    panel: 'Panel',
    terms: 'Academic terms',
    grades: 'Grades',
    reports: 'Reports',
    cohorts: 'Cohorts',
    automations: 'Automations',
    security: 'Security',
    myEnrollments: 'My enrollments',
    myCertificates: 'My certificates',
    certificateTemplates: 'Certificate templates',
    branding: 'Branding settings',
    domains: 'Domains',
    maintenance: 'Maintenance',
    users: 'Users and roles',
    profile: 'My profile',
    logout: 'Log out',
    openMenu: 'Open menu',
    defaultUserLabel: 'Your account',
  },
  maintenanceBanner: {
    message: 'Maintenance mode is on — everyone else is locked out of the platform.',
    disable: 'Turn it off',
  },
  footer: {
    poweredBy: 'Made with Stoka LMS',
  },
  common: {
    save: 'Save',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    remove: 'Remove',
    create: 'Create',
    add: 'Add',
    back: 'Back',
    continue: 'Continue',
    close: 'Close',
    confirm: 'Confirm',
    send: 'Send',
    download: 'Download',
    upload: 'Upload',
    view: 'View',
    search: 'Search',
    loading: 'Loading…',
    noPermission: "You don't have permission to view this screen.",
    optional: '(optional)',
    yes: 'Yes',
    no: 'No',
    active: 'Active',
    inactive: 'Inactive',
    status: 'Status',
    name: 'Name',
    email: 'Email',
    date: 'Date',
    actions: 'Actions',
    done: 'Done.',
  },
} satisfies Record<keyof typeof es, Record<string, string>>;

const dictionaries = { es, en };

export type AppDictionary = typeof es;

export function getAppDictionary(locale: Locale): AppDictionary {
  return dictionaries[locale];
}
