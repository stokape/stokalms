// ============================================================================
// eslint.config.mjs — Config de ESLint 9 (formato "flat") para el backend.
// Faltaba este archivo: "npm run lint" acá adentro fallaba directo con
// "ESLint couldn't find an eslint.config.js" (ESLint 9 ya no lee .eslintrc.*).
// Se apoya en "typescript-eslint" (el paquete, no el plugin viejo) igual que
// hace apps/web/eslint.config.mjs con "eslint-config-next" — mismo patron,
// plugin distinto porque acá no hay Next.js.
//
// A proposito NO se usa "recommendedTypeChecked" (el set de reglas que
// necesita el type-checker de TS corriendo adentro de ESLint): es mucho mas
// lento y, en un backend que nunca tuvo lint corriendo, hoy mismo saldrian
// cientos de avisos "no-unsafe-*" sin relacion con ningun bug real. Se puede
// subir a esa variante mas adelante, a proposito, no como efecto secundario
// de simplemente arreglar el archivo que faltaba.
// ============================================================================
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
    },
    rules: {
      // NestJS se apoya en decoradores + inyeccion por parametros de
      // constructor (@Injectable, @Controller...) — un parametro "no usado"
      // dentro del cuerpo del metodo puede seguir siendo la forma en que
      // Nest declara una dependencia o un DTO tipado; mismo criterio de
      // "_" para lo que a proposito no se usa que ya usa apps/web.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Prisma/Casbin y varias libs de terceros no traen tipos lo bastante
      // precisos como para prohibir "any" del todo sin generar friccion
      // constante — mismo trade-off que hace el propio starter de NestJS.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
