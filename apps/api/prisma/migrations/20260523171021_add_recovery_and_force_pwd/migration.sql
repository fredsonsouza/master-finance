/*
  Warnings:

  - A unique constraint covering the columns `[recoveryEmail]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recoveryEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_recoveryEmail_key" ON "users"("recoveryEmail");
