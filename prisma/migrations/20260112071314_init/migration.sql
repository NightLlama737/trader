/*
  Warnings:

  - You are about to drop the column `url` on the `Model` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `OffModel` table. All the data in the column will be lost.
  - Added the required column `key` to the `Model` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `OffModel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Model" DROP COLUMN "url",
ADD COLUMN     "key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OffModel" DROP COLUMN "url",
ADD COLUMN     "key" TEXT NOT NULL;
