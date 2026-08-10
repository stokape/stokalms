// ============================================================================
// dictionaries/entrar.ts — Textos de entrar/page.tsx en español e inglés.
// Ver la nota de alcance en dictionaries/landing.ts.
// ============================================================================

import type { Locale } from '@/lib/locale';

const es = {
  back: 'Volver al inicio',
  title: 'Encuentra tu institución',
  subtitle:
    'Escribe el nombre con el que tu institución se registró en Stoka LMS. Te llevaremos a su página, donde vas a poder iniciar sesión con tu usuario y contraseña.',
  notFound: (slug: string) =>
    `No encontramos ninguna institución llamada "${slug}". Verifica que esté escrita igual que cuando se registró.`,
  foundTitle: '¡La encontramos!',
  foundBody: (domain: string) => `Tu institución está en ${domain}. Continúa ahí para iniciar sesión.`,
  continueLink: 'Continuar',
  searchAgain: 'Buscar otra institución',
  fieldLabel: 'Nombre de tu institución',
  placeholder: 'mi-institucion',
  continue: 'Continuar',
  noAccount: '¿Todavía no tienes una cuenta?',
  registerLink: 'Inscribe tu institución',
};

const en = {
  back: 'Back to home',
  title: 'Find your institution',
  subtitle:
    "Enter the name your institution registered with on Stoka LMS. We'll take you to its page, where you can log in with your username and password.",
  notFound: (slug: string) =>
    `We couldn't find any institution called "${slug}". Check that it's spelled the same way it was registered.`,
  foundTitle: 'We found it!',
  foundBody: (domain: string) => `Your institution is at ${domain}. Continue there to log in.`,
  continueLink: 'Continue',
  searchAgain: 'Search for another institution',
  fieldLabel: 'Your institution name',
  placeholder: 'my-institution',
  continue: 'Continue',
  noAccount: "Don't have an account yet?",
  registerLink: 'Register your institution',
};

const dictionaries = { es, en };

export type EntrarDictionary = typeof es;

export function getEntrarDictionary(locale: Locale): EntrarDictionary {
  return dictionaries[locale];
}
