-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'INVENTORY';

-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_unitId_fkey";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "unitId";
