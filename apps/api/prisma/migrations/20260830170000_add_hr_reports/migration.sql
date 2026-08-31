-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SENT');

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
    "sectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "hr_reports_userId_status_reportDate_idx" ON "hr_reports"("userId", "status", "reportDate");
CREATE INDEX IF NOT EXISTS "hr_reports_unitId_reportDate_idx" ON "hr_reports"("unitId", "reportDate");
CREATE INDEX IF NOT EXISTS "hr_reports_status_sentAt_idx" ON "hr_reports"("status", "sentAt");

-- AddForeignKey
ALTER TABLE "hr_reports" ADD CONSTRAINT "hr_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hr_reports" ADD CONSTRAINT "hr_reports_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_reports" ADD CONSTRAINT "hr_reports_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
