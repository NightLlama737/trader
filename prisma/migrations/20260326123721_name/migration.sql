-- DropForeignKey
ALTER TABLE "ModelGift" DROP CONSTRAINT "ModelGift_modelId_fkey";

-- AddForeignKey
ALTER TABLE "ModelGift" ADD CONSTRAINT "ModelGift_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;
