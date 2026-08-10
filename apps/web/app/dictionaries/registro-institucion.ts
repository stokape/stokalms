// ============================================================================
// dictionaries/registro-institucion.ts — Textos de
// registro-institucion/page.tsx en español e inglés. Ver la nota de
// alcance en dictionaries/landing.ts.
//
// Los MENSAJES DE ERROR que puede devolver el backend (ver actions.ts,
// "toErrorMessage") quedan fuera de este diccionario a propósito: vienen
// generados del lado del servidor, siempre en español — traducirlos
// también exigiría internacionalizar el backend entero, que es
// justamente el alcance más grande que se dejó fuera de esta tanda.
// ============================================================================

import type { Locale } from '@/lib/locale';

const es = {
  back: 'Volver al inicio',
  title: 'Inscribe tu institución',
  subtitle:
    'Completa este formulario y un administrador de la plataforma revisará tu solicitud. Te contactaremos al email que dejes aquí con la respuesta.',
  successTitle: '¡Listo! Recibimos tu solicitud.',
  successBody:
    'Te escribiremos al email que dejaste apenas la revisemos. Mientras tanto, no hace falta que hagas nada más.',
  // Se muestra en vez de "subtitle" cuando se llega desde /precios con
  // "?plan=enterprise" (ver app/precios/actions.ts) — el plan Enterprise no
  // tiene autoservicio instantáneo, así que este mismo formulario funciona
  // como el "contactar con ventas" de esa página.
  enterpriseIntro:
    'Cuéntanos sobre tu organización y un especialista de Stoka LMS te contactará para hablar del plan Enterprise.',
  enterpriseMessagePrefill: 'Estoy interesado/a en el plan Enterprise de Stoka LMS.',
  institutionNameLabel: 'Nombre de la institución',
  institutionNamePlaceholder: 'Ej. Instituto San Martín',
  subdomainLabel: 'Subdominio que quieres usar',
  subdomainHelp: 'Solo minúsculas, números y guiones (ej. "instituto-sanmartin").',
  // Se muestra en vez de "subdomainHelp" MIENTRAS el campo todavia se esta
  // completando solo, a partir del nombre (ver RegistrationForm.tsx) — para
  // que quede claro que ese valor es una sugerencia editable, no un dato ya
  // fijo.
  subdomainAutoHelp: 'Lo completamos por ti a partir del nombre — cámbialo si quieres otro.',
  contactNameLabel: 'Tu nombre',
  contactNamePlaceholder: 'Quien va a ser el administrador de la institución',
  contactEmailLabel: 'Tu email',
  messageLabel: 'Cuéntanos un poco más (opcional)',
  messagePlaceholder: 'Ej. cuántos estudiantes tienen, qué cursos dictan...',
  submit: 'Enviar solicitud',
};

const en = {
  back: 'Back to home',
  title: 'Register your institution',
  subtitle:
    "Fill out this form and a platform administrator will review your request. We'll contact you at the email you leave here with the response.",
  successTitle: 'Done! We received your request.',
  successBody:
    "We'll email you as soon as we review it. In the meantime, there's nothing else you need to do.",
  enterpriseIntro:
    'Tell us about your organization and a Stoka LMS specialist will reach out to talk about the Enterprise plan.',
  enterpriseMessagePrefill: "I'm interested in the Stoka LMS Enterprise plan.",
  institutionNameLabel: 'Institution name',
  institutionNamePlaceholder: 'E.g. Saint Martin Institute',
  subdomainLabel: 'Subdomain you want to use',
  subdomainHelp: 'Lowercase letters, numbers, and hyphens only (e.g. "saint-martin-institute").',
  subdomainAutoHelp: "We filled this in from the name — change it if you'd like a different one.",
  contactNameLabel: 'Your name',
  contactNamePlaceholder: "Who will be the institution's administrator",
  contactEmailLabel: 'Your email',
  messageLabel: 'Tell us a bit more (optional)',
  messagePlaceholder: 'E.g. how many students you have, what courses you teach...',
  submit: 'Send request',
};

const dictionaries = { es, en };

export type RegistroInstitucionDictionary = typeof es;

export function getRegistroInstitucionDictionary(locale: Locale): RegistroInstitucionDictionary {
  return dictionaries[locale];
}
