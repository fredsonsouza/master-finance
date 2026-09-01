-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date" DESC);

-- CreateIndex
CREATE INDEX "transactions_unitId_type_date_idx" ON "transactions"("unitId", "type", "date" DESC);
