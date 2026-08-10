-- AlterTable
ALTER TABLE "courses" ADD COLUMN "certificate_template_id" TEXT;

-- CreateTable
CREATE TABLE "enrollment_attachments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_views" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "first_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "courses_certificate_template_id_idx" ON "courses"("certificate_template_id");

-- CreateIndex
CREATE INDEX "enrollment_attachments_tenant_id_idx" ON "enrollment_attachments"("tenant_id");

-- CreateIndex
CREATE INDEX "enrollment_attachments_enrollment_id_idx" ON "enrollment_attachments"("enrollment_id");

-- CreateIndex
CREATE INDEX "lesson_views_tenant_id_idx" ON "lesson_views"("tenant_id");

-- CreateIndex
CREATE INDEX "lesson_views_enrollment_id_idx" ON "lesson_views"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_views_enrollment_id_lesson_id_key" ON "lesson_views"("enrollment_id", "lesson_id");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_certificate_template_id_fkey" FOREIGN KEY ("certificate_template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_attachments" ADD CONSTRAINT "enrollment_attachments_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_attachments" ADD CONSTRAINT "enrollment_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "user_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_views" ADD CONSTRAINT "lesson_views_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_views" ADD CONSTRAINT "lesson_views_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
