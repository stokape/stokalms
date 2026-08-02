-- CreateTable
CREATE TABLE "tenant_registration_requests" (
    "id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "desired_subdomain" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_tenant_id" TEXT,

    CONSTRAINT "tenant_registration_requests_pkey" PRIMARY KEY ("id")
);
