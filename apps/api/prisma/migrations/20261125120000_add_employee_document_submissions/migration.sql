-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EmployeeSubmissionCategory" AS ENUM (
        'MEDICAL_CERTIFICATE',
        'ATTENDANCE_DECLARATION',
        'PERSONAL_DOCUMENT',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EmployeeSubmissionStatus" AS ENUM (
        'PENDING',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "employee_document_submissions" (
    "id" TEXT NOT NULL,
    "category" "EmployeeSubmissionCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "EmployeeSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "daysCount" INTEGER,
    "cid" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "employeeId" TEXT NOT NULL,
    "unitId" TEXT,
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_document_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "employee_document_submission_files" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_document_submission_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "employee_document_submissions_employeeId_status_createdAt_idx"
    ON "employee_document_submissions"("employeeId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "employee_document_submissions_submittedById_createdAt_idx"
    ON "employee_document_submissions"("submittedById", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "employee_document_submissions_status_category_createdAt_idx"
    ON "employee_document_submissions"("status", "category", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "employee_document_submissions_unitId_status_idx"
    ON "employee_document_submissions"("unitId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "employee_document_submission_files_submissionId_key"
    ON "employee_document_submission_files"("submissionId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "employee_document_submissions"
        ADD CONSTRAINT "employee_document_submissions_employeeId_fkey"
        FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "employee_document_submissions"
        ADD CONSTRAINT "employee_document_submissions_unitId_fkey"
        FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "employee_document_submissions"
        ADD CONSTRAINT "employee_document_submissions_submittedById_fkey"
        FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "employee_document_submissions"
        ADD CONSTRAINT "employee_document_submissions_reviewedById_fkey"
        FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "employee_document_submission_files"
        ADD CONSTRAINT "employee_document_submission_files_submissionId_fkey"
        FOREIGN KEY ("submissionId") REFERENCES "employee_document_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
