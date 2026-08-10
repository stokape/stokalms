-- CreateTable
CREATE TABLE "student_notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_notes_tenant_id_idx" ON "student_notes"("tenant_id");

-- CreateIndex
CREATE INDEX "student_notes_enrollment_id_idx" ON "student_notes"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_enrollment_id_session_date_key" ON "attendance_records"("enrollment_id", "session_date");

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
