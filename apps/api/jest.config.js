// ============================================================================
// jest.config.js — Configuracion minima para correr pruebas unitarias del
// backend con TypeScript (ts-jest, ya estaba en devDependencies pero sin
// configurar: "npm run test" no encontraba como transformar los .ts).
//
// Deliberadamente acotado a pruebas UNITARIAS de funciones puras (ver
// src/common/csv/csv.util.spec.ts, el primer caso real) — no arma un
// entorno de integracion con base de datos/Nest TestingModule todavia; eso
// es un paso aparte, mas grande, para otro momento (ver
// docs/security-audit, SECURITY-05/06).
// ============================================================================

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
};
