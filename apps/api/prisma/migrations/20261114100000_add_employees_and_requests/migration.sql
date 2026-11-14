-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'HR';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EmployeeDocumentType" AS ENUM ('DECLARATION', 'WARNING', 'RECEIPT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EmployeeRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "employees" (
    "id" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "esocialCode" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "employerName" TEXT NOT NULL DEFAULT 'GERENCIACLIN LTDA',
    "employerCnpj" TEXT NOT NULL DEFAULT '59.162.564/0001-73',
    "employerAddress" TEXT NOT NULL DEFAULT 'Rua IVONE PINHEIRO, 1590, SALA 08, TANCREDO NEVES, BOA VISTA, RR',
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "nationality" TEXT DEFAULT 'Brasileira',
    "maritalStatus" TEXT,
    "raceColor" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "address" TEXT,
    "zipCode" TEXT,
    "landlinePhone" TEXT,
    "mobilePhone" TEXT,
    "email" TEXT,
    "beneficiaries" JSONB,
    "cpf" TEXT NOT NULL,
    "rgNumber" TEXT,
    "rgIssueDate" TIMESTAMP(3),
    "rgIssuer" TEXT,
    "ctpsNumber" TEXT,
    "ctpsSeries" TEXT,
    "ctpsIssueDate" TIMESTAMP(3),
    "ctpsState" TEXT DEFAULT 'RR',
    "voterRegistration" TEXT,
    "voterZone" TEXT,
    "voterSection" TEXT,
    "cnhNumber" TEXT,
    "cnhCategory" TEXT,
    "militaryDoc" TEXT,
    "militaryCategory" TEXT,
    "classCouncilNumber" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "cboCode" TEXT,
    "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentType" TEXT DEFAULT 'Mensal',
    "workHoursSummary" TEXT,
    "breakHoursSummary" TEXT,
    "fgtsOptionDate" TIMESTAMP(3),
    "fgtsRectificationDate" TIMESTAMP(3),
    "fgtsBankAccount" TEXT,
    "pisRegistrationDate" TIMESTAMP(3),
    "pisNumber" TEXT,
    "pisBankName" TEXT,
    "pisBankNumber" TEXT,
    "pisBankBranch" TEXT,
    "pisBankAddress" TEXT,
    "workSchedule" JSONB,
    "salaryRoleHistory" JSONB,
    "vacationsHistory" JSONB,
    "occupationalHealthHistory" JSONB,
    "unionContributions" JSONB,
    "generalObservations" TEXT,
    "terminationDate" TIMESTAMP(3),
    "terminationType" TEXT,
    "terminationNotes" TEXT,
    "userId" TEXT,
    "unitId" TEXT,
    "sectorId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "employee_requests" (
    "id" TEXT NOT NULL,
    "type" "EmployeeDocumentType" NOT NULL,
    "subtype" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EmployeeRequestStatus" NOT NULL DEFAULT 'OPEN',
    "amount" DOUBLE PRECISION,
    "referenceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateData" JSONB,
    "rejectionReason" TEXT,
    "verificationCode" TEXT,
    "contentHash" TEXT,
    "signedAt" TIMESTAMP(3),
    "employeeId" TEXT NOT NULL,
    "unitId" TEXT,
    "requestedById" TEXT NOT NULL,
    "issuedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "employees_registrationNumber_key" ON "employees"("registrationNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "employees_cpf_key" ON "employees"("cpf");
CREATE UNIQUE INDEX IF NOT EXISTS "employees_userId_key" ON "employees"("userId");
CREATE INDEX IF NOT EXISTS "employees_status_fullName_idx" ON "employees"("status", "fullName");
CREATE INDEX IF NOT EXISTS "employees_unitId_status_idx" ON "employees"("unitId", "status");
CREATE INDEX IF NOT EXISTS "employees_sectorId_idx" ON "employees"("sectorId");
CREATE INDEX IF NOT EXISTS "employees_registrationNumber_idx" ON "employees"("registrationNumber");
CREATE INDEX IF NOT EXISTS "employees_cpf_idx" ON "employees"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "employee_requests_verificationCode_key" ON "employee_requests"("verificationCode");
CREATE INDEX IF NOT EXISTS "employee_requests_employeeId_status_createdAt_idx" ON "employee_requests"("employeeId", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "employee_requests_requestedById_createdAt_idx" ON "employee_requests"("requestedById", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "employee_requests_status_type_createdAt_idx" ON "employee_requests"("status", "type", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "employee_requests_unitId_status_idx" ON "employee_requests"("unitId", "status");
CREATE INDEX IF NOT EXISTS "employee_requests_verificationCode_idx" ON "employee_requests"("verificationCode");

-- AddForeignKey
ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_userId_fkey";
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_unitId_fkey";
ALTER TABLE "employees" ADD CONSTRAINT "employees_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_sectorId_fkey";
ALTER TABLE "employees" ADD CONSTRAINT "employees_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_createdById_fkey";
ALTER TABLE "employees" ADD CONSTRAINT "employees_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employee_requests" DROP CONSTRAINT IF EXISTS "employee_requests_employeeId_fkey";
ALTER TABLE "employee_requests" ADD CONSTRAINT "employee_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_requests" DROP CONSTRAINT IF EXISTS "employee_requests_unitId_fkey";
ALTER TABLE "employee_requests" ADD CONSTRAINT "employee_requests_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employee_requests" DROP CONSTRAINT IF EXISTS "employee_requests_requestedById_fkey";
ALTER TABLE "employee_requests" ADD CONSTRAINT "employee_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employee_requests" DROP CONSTRAINT IF EXISTS "employee_requests_issuedById_fkey";
ALTER TABLE "employee_requests" ADD CONSTRAINT "employee_requests_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
