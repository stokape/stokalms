-- El default de "plan" era "basico", un valor que no coincide con
-- ninguno de los 4 IDs reales de plan (ver apps/web/lib/pricing.ts:
-- "starter" | "business" | "pro" | "enterprise") -- se detecto al
-- construir el endpoint para que un Administrador de plataforma pueda
-- asignar el plan de una institucion (PATCH /platform/tenants/:id/plan).
ALTER TABLE "tenants" ALTER COLUMN "plan" SET DEFAULT 'starter';

-- Corrige las filas ya creadas con el default viejo -- sin esto quedarian
-- para siempre con un valor invalido que ningun selector del frontend
-- podria mostrar seleccionado.
UPDATE "tenants" SET "plan" = 'starter' WHERE "plan" = 'basico';
