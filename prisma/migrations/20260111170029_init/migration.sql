/*
  Warnings:

  - Added the required column `url` to the `OffModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `OffModel` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OffModel" DROP CONSTRAINT "OffModel_modelId_fkey";

-- DropIndex
DROP INDEX "OffModel_modelId_key";

-- AlterTable
ALTER TABLE "OffModel" ADD COLUMN     "url" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "modelId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OffModel" ADD CONSTRAINT "OffModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffModel" ADD CONSTRAINT "OffModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE SET NULL ON UPDATE CASCADE;
