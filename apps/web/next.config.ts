import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
