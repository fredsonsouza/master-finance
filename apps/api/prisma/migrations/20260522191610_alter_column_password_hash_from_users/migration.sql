/*
  Warnings:

  - You are about to drop the column `_password_hash` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "_password_hash",
ADD COLUMN     "password_hash" TEXT;
