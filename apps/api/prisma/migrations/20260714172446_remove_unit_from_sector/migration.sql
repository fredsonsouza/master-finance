/*
  Warnings:

  - You are about to drop the column `unitId` on the `sectors` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sectors" DROP CONSTRAINT "sectors_unitId_fkey";

-- AlterTable
ALTER TABLE "sectors" DROP COLUMN "unitId";
