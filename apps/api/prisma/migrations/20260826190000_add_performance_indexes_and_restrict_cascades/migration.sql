-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_itemId_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_unitId_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_userId_fkey";
ALTER TABLE "cash_closures" DROP CONSTRAINT IF EXISTS "cash_closures_unitId_fkey";
ALTER TABLE "cash_closures" DROP CONSTRAINT IF EXISTS "cash_closures_userId_fkey";
ALTER TABLE "collections" DROP CONSTRAINT IF EXISTS "collections_collectorId_fkey";
ALTER TABLE "collections" DROP CONSTRAINT IF EXISTS "collections_unitId_fkey";
ALTER TABLE "collections" DROP CONSTRAINT IF EXISTS "collections_userId_fkey";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
ALTER TABLE "evaluations" DROP CONSTRAINT IF EXISTS "evaluations_sellerId_fkey";

-- AddForeignKey with ON DELETE RESTRICT
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "collections" ADD CONSTRAINT "collections_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "collections" ADD CONSTRAINT "collections_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transactions_unitId_month_type_idx" ON "transactions"("unitId", "month", "type");
CREATE INDEX IF NOT EXISTS "transactions_itemId_unitId_date_idx" ON "transactions"("itemId", "unitId", "date");
CREATE INDEX IF NOT EXISTS "transactions_unitId_date_id_idx" ON "transactions"("unitId", "date", "id");
CREATE INDEX IF NOT EXISTS "transactions_sectorId_idx" ON "transactions"("sectorId");
CREATE INDEX IF NOT EXISTS "transactions_userId_idx" ON "transactions"("userId");
CREATE INDEX IF NOT EXISTS "transactions_batchId_idx" ON "transactions"("batchId");

CREATE INDEX IF NOT EXISTS "cash_closures_unitId_status_cashDate_idx" ON "cash_closures"("unitId", "status", "cashDate");
CREATE INDEX IF NOT EXISTS "cash_closures_sectorId_idx" ON "cash_closures"("sectorId");
CREATE INDEX IF NOT EXISTS "cash_closures_userId_idx" ON "cash_closures"("userId");

CREATE INDEX IF NOT EXISTS "collections_unitId_requestDate_idx" ON "collections"("unitId", "requestDate");
CREATE INDEX IF NOT EXISTS "collections_collectorId_idx" ON "collections"("collectorId");
CREATE INDEX IF NOT EXISTS "collections_userId_idx" ON "collections"("userId");

CREATE INDEX IF NOT EXISTS "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_action_createdAt_idx" ON "audit_logs"("resource", "action", "createdAt");

CREATE INDEX IF NOT EXISTS "evaluations_sellerId_createdAt_idx" ON "evaluations"("sellerId", "createdAt");
CREATE INDEX IF NOT EXISTS "evaluations_unitId_createdAt_idx" ON "evaluations"("unitId", "createdAt");
