/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `OffModel` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OffModel_key_key" ON "OffModel"("key");
