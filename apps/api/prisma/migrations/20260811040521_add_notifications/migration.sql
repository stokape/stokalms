-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "notifications_user_tenant_id_read_idx" ON "notifications"("user_tenant_id", "read");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_tenant_id_fkey" FOREIGN KEY ("user_tenant_id") REFERENCES "user_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
