import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Los Server Actions que se usan como "action" de un <form> SIEMPRE
      // reciben FormData como ultimo argumento (React/Next lo exige por
      // firma), aunque la funcion no necesite leer ningun campo del form
      // (ej. un boton de "Cerrar sesion" sin campos) — prefijar ese
      // parametro con "_" es la convencion ya establecida en todo el
      // proyecto para decir "a proposito no se usa", ver session-actions.ts
      // y matriculas/.../certificados/actions.ts.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
