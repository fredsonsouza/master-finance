-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "hr_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "unitId" TEXT,
    "sector" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_reports_pkey" PRIMARY KEY ("id")
);

-- Migration safety for existing sectorId column
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hr_reports' AND column_name = 'sectorId'
    ) THEN
        ALTER TABLE "hr_reports" DROP CONSTRAINT IF EXISTS "hr_reports_sectorId_fkey";
        ALTER TABLE "hr_reports" DROP COLUMN IF EXISTS "sectorId";
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'hr_reports' AND column_name = 'sector'
        ) THEN
            ALTER TABLE "hr_reports" ADD COLUMN "sector" TEXT;
        END IF;
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "hr_reports_userId_status_reportDate_idx" ON "hr_reports"("userId", "status", "reportDate");
CREATE INDEX IF NOT EXISTS "hr_reports_unitId_reportDate_idx" ON "hr_reports"("unitId", "reportDate");
CREATE INDEX IF NOT EXISTS "hr_reports_status_sentAt_idx" ON "hr_reports"("status", "sentAt");

-- AddForeignKey
ALTER TABLE "hr_reports" DROP CONSTRAINT IF EXISTS "hr_reports_userId_fkey";
ALTER TABLE "hr_reports" ADD CONSTRAINT "hr_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hr_reports" DROP CONSTRAINT IF EXISTS "hr_reports_unitId_fkey";
ALTER TABLE "hr_reports" ADD CONSTRAINT "hr_reports_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
