-- CreateIndex
CREATE INDEX "evaluations_createdAt_idx" ON "evaluations"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "evaluations_unitId_createdAt_desc_idx" ON "evaluations"("unitId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "evaluations_sellerId_createdAt_desc_idx" ON "evaluations"("sellerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "evaluations_unitId_rating_createdAt_idx" ON "evaluations"("unitId", "rating", "createdAt");
