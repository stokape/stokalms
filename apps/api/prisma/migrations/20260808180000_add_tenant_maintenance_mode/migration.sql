-- Modo mantenimiento por tenant: pantalla temporal que reemplaza el home
-- publico y bloquea el resto de la app para cualquiera sin el permiso
-- "tenant:edit" (Super Admin / Administrador de entidad).
ALTER TABLE "tenants" ADD COLUMN "maintenance_mode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenants" ADD COLUMN "maintenance_message" TEXT;
ALTER TABLE "tenants" ADD COLUMN "maintenance_ends_at" TIMESTAMP(3);
