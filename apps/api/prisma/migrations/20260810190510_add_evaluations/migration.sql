-- CreateEnum
CREATE TYPE "EvaluationRating" AS ENUM ('EXCELLENT', 'GOOD', 'REGULAR', 'BAD');

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "unitId" TEXT,
    "rating" "EvaluationRating" NOT NULL,
    "presetComment" TEXT,
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
