-- AlterTable
ALTER TABLE "Gift" ADD COLUMN     "productId" TEXT,
ADD COLUMN     "categoryId" TEXT;

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Gift_productId_idx" ON "Gift"("productId");

-- CreateIndex
CREATE INDEX "Gift_categoryId_idx" ON "Gift"("categoryId");
