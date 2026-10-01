-- CreateIndex
CREATE INDEX "cash_closures_cashDate_idx" ON "cash_closures"("cashDate" DESC);

-- CreateIndex
CREATE INDEX "cash_closures_unitId_cashDate_idx" ON "cash_closures"("unitId", "cashDate" DESC);
