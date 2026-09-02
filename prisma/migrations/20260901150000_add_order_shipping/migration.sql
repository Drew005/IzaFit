-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "addressId" TEXT,
ADD COLUMN     "shippingRecipient" TEXT,
ADD COLUMN     "shippingStreet" TEXT,
ADD COLUMN     "shippingNumber" TEXT,
ADD COLUMN     "shippingComplement" TEXT,
ADD COLUMN     "shippingDistrict" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingState" TEXT,
ADD COLUMN     "shippingZipCode" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Order_addressId_idx" ON "Order"("addressId");