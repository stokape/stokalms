-- CreateTable
CREATE TABLE "report_presets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_presets_tenant_id_idx" ON "report_presets"("tenant_id");

-- AddForeignKey
ALTER TABLE "report_presets" ADD CONSTRAINT "report_presets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
