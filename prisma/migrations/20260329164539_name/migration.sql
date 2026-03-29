/*
  Warnings:

  - You are about to drop the column `paymentDetails` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "stripeSessionId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "paymentDetails",
ADD COLUMN     "bankAccount" TEXT;
