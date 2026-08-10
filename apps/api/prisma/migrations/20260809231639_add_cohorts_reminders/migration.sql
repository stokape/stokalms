-- AlterTable
ALTER TABLE "user_tenants" ADD COLUMN     "cohort_id" TEXT;

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "user_tenant_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cohorts_tenant_id_idx" ON "cohorts"("tenant_id");

-- CreateIndex
CREATE INDEX "reminder_logs_tenant_id_idx" ON "reminder_logs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_logs_type_reference_id_user_tenant_id_key" ON "reminder_logs"("type", "reference_id", "user_tenant_id");

-- CreateIndex
CREATE INDEX "user_tenants_cohort_id_idx" ON "user_tenants"("cohort_id");

-- AddForeignKey
ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_user_tenant_id_fkey" FOREIGN KEY ("user_tenant_id") REFERENCES "user_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
