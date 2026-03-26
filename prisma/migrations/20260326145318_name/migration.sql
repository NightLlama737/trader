-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_offModelId_fkey";

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_offModelId_fkey" FOREIGN KEY ("offModelId") REFERENCES "OffModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
