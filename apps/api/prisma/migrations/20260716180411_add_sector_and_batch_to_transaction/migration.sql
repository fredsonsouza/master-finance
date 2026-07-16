-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "sectorId" TEXT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
