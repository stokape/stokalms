-- Agrega verificacion de propiedad a los dominios propios de un tenant.
-- "is_verified" default true: las filas existentes (subdominios que la
-- propia plataforma emitio al aprobar cada institucion) no necesitan
-- verificarse. Los dominios nuevos que agregue un Administrador de
-- plataforma via el endpoint nuevo se crean explicitamente con false.
ALTER TABLE "tenant_domains" ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tenant_domains" ADD COLUMN "verification_token" TEXT;
ALTER TABLE "tenant_domains" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
