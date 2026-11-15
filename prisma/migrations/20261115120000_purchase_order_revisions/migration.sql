-- AlterTable
ALTER TABLE "purchase_order" ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "purchase_order_revision" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reason" TEXT,
    "revisedById" TEXT NOT NULL,
    "revisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_revision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchase_order_revision_revisedById_idx" ON "purchase_order_revision"("revisedById");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_revision_purchaseOrderId_revision_key" ON "purchase_order_revision"("purchaseOrderId", "revision");

-- AddForeignKey
ALTER TABLE "purchase_order_revision" ADD CONSTRAINT "purchase_order_revision_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_revision" ADD CONSTRAINT "purchase_order_revision_revisedById_fkey" FOREIGN KEY ("revisedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
