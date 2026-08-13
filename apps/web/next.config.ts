import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empaqueta en ".next/standalone" solo los archivos y dependencias que la
  // app REALMENTE usa (Next.js rastrea los imports) — sin esto, la imagen
  // Docker de produccion tendria que llevarse los node_modules enteros del
  // monorepo (workspaces hoisteados, decenas de paquetes de apps/api
  // incluidos) para poder correr "next start". Ver apps/web/Dockerfile.
  output: "standalone",
  // Desde Next.js 16.3, "next dev"/"next build" generan AGENTS.md/CLAUDE.md
  // solos en la raiz de esta app — este repo ya trae su propia
  // documentacion para agentes (ver CLAUDE.md/README.md de la raiz del
  // monorepo), no hace falta un segundo set autogenerado por app.
  agentRules: false,
  experimental: {
    // El limite por defecto de un Server Action es 1MB — muy poco para
    // subir un video o un PDF como recurso de leccion (ver
    // app/(app)/cursos/[courseId]/modulos/.../actions.ts). El limite real
    // que importa igual lo aplica el backend (STORAGE_MAX_UPLOAD_MB, ver
    // apps/api/.env.example), este solo evita que Next.js corte ANTES de
    // que el archivo llegue siquiera a la Server Action.
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
