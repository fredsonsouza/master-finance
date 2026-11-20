-- 1. Add granular PBAC permissions column to users
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "users_permissions_gin_idx"
ON "users" USING GIN ("permissions");

-- 2. Backfill existing production users 1-to-1 from legacy roles before narrowing Role enum
-- (Only runs for users whose permissions array is still empty so retries never overwrite custom permissions)
UPDATE "users"
SET "permissions" = ARRAY[
  'scope:all_units',
  'dashboard:view',
  'reports:view',
  'transactions:manage',
  'items:manage',
  'cash_closures:manage',
  'collections:manage',
  'evaluations:manage',
  'employees:manage',
  'hr_reports:manage',
  'settings:structure'
]::TEXT[]
WHERE "role"::text = 'MANAGER' AND cardinality("permissions") = 0;

UPDATE "users"
SET "permissions" = ARRAY[
  'scope:all_units',
  'dashboard:view',
  'employees:manage',
  'hr_reports:manage',
  'evaluations:manage',
  'users:manage',
  'transactions:manage',
  'items:manage',
  'cash_closures:manage',
  'collections:manage'
]::TEXT[]
WHERE "role"::text = 'HR' AND cardinality("permissions") = 0;

UPDATE "users"
SET "permissions" = ARRAY[
  'scope:all_units',
  'dashboard:view',
  'cash_closures:manage'
]::TEXT[]
WHERE "role"::text = 'FINANCIAL' AND cardinality("permissions") = 0;

UPDATE "users"
SET "permissions" = ARRAY[
  'cash_closures:create',
  'evaluations:receive'
]::TEXT[]
WHERE "role"::text = 'SELLER' AND cardinality("permissions") = 0;

UPDATE "users"
SET "permissions" = ARRAY[
  'collections:execute'
]::TEXT[]
WHERE "role"::text = 'COLLECTOR' AND cardinality("permissions") = 0;

UPDATE "users"
SET "permissions" = ARRAY[
  'scope:all_units',
  'collections:manage'
]::TEXT[]
WHERE "role"::text = 'FISCAL' AND cardinality("permissions") = 0;

UPDATE "users"
SET "permissions" = ARRAY[
  'scope:all_units',
  'dashboard:view',
  'transactions:manage',
  'items:manage',
  'settings:structure'
]::TEXT[]
WHERE "role"::text = 'INVENTORY' AND cardinality("permissions") = 0;

UPDATE "users"
SET "permissions" = ARRAY[
  'dashboard:view',
  'transactions:manage'
]::TEXT[]
WHERE "role"::text = 'EMPLOYEE' AND cardinality("permissions") = 0;

UPDATE "users"
SET "permissions" = ARRAY[]::TEXT[]
WHERE "role"::text IN ('ANALYST', 'ADMIN');

-- 3. Narrow Role enum safely to ADMIN and EMPLOYEE (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Role'
      AND e.enumlabel NOT IN ('ADMIN', 'EMPLOYEE')
  ) THEN
    CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'EMPLOYEE');
    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING (
      CASE
        WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"Role_new"
        ELSE 'EMPLOYEE'::"Role_new"
      END
    );
    ALTER TYPE "Role" RENAME TO "Role_old";
    ALTER TYPE "Role_new" RENAME TO "Role";
    DROP TYPE "Role_old";
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
  END IF;
END $$;

-- 4. Create clinical Departments (dedicated to HR, completely separate from Inventory Sectors)
DO $$ BEGIN
  CREATE TYPE "DepartmentType" AS ENUM ('GENERAL', 'RECEPTION', 'COLLECTION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DepartmentType" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "departments_name_key" ON "departments"("name");

-- 5. Seed initial clinical departments (idempotent)
INSERT INTO "departments" ("id", "name", "type", "createdAt", "updatedAt") VALUES
  ('d0000001-0000-4000-8000-000000000001', 'Recepção', 'RECEPTION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('d0000002-0000-4000-8000-000000000002', 'Coleta', 'COLLECTION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('d0000003-0000-4000-8000-000000000003', 'Recursos Humanos', 'GENERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('d0000004-0000-4000-8000-000000000004', 'Financeiro', 'GENERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('d0000005-0000-4000-8000-000000000005', 'Administrativo', 'GENERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('d0000006-0000-4000-8000-000000000006', 'Estoque', 'GENERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- 6. Link employees to clinical departments (nullable so existing records are preserved)
ALTER TABLE "employees"
ADD COLUMN IF NOT EXISTS "departmentId" TEXT;

CREATE INDEX IF NOT EXISTS "employees_departmentId_idx" ON "employees"("departmentId");

ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_departmentId_fkey";
ALTER TABLE "employees"
ADD CONSTRAINT "employees_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
