-- CreateEnum
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('AIR_FREIGHT', 'LOCAL_DELIVERY', 'PICK_UP');

-- CreateTable
CREATE TABLE "goods_receipt" (
    "id" TEXT NOT NULL,
    "number" CITEXT NOT NULL,
    "receiptDate" DATE NOT NULL,
    "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'DRAFT',
    "purchaseOrderId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierAddress" TEXT,
    "invoiceNo" TEXT,
    "deliveredBy" "DeliveryMethod" NOT NULL,
    "remarks" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_line" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "purchaseOrderLineId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "itemCode" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "orderedQty" DECIMAL(14,2) NOT NULL,
    "outstandingQty" DECIMAL(14,2) NOT NULL,
    "receivedQty" DECIMAL(14,2) NOT NULL,
    "shortQty" DECIMAL(14,2) NOT NULL,
    "excessQty" DECIMAL(14,2) NOT NULL,
    "rejectedQty" DECIMAL(14,2) NOT NULL,
    "acceptedQty" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "goods_receipt_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipt_number_key" ON "goods_receipt"("number");

-- CreateIndex
CREATE INDEX "goods_receipt_purchaseOrderId_idx" ON "goods_receipt"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "goods_receipt_projectId_idx" ON "goods_receipt"("projectId");

-- CreateIndex
CREATE INDEX "goods_receipt_departmentId_idx" ON "goods_receipt"("departmentId");

-- CreateIndex
CREATE INDEX "goods_receipt_createdById_idx" ON "goods_receipt"("createdById");

-- CreateIndex
CREATE INDEX "goods_receipt_status_idx" ON "goods_receipt"("status");

-- CreateIndex
CREATE INDEX "goods_receipt_receiptDate_idx" ON "goods_receipt"("receiptDate");

-- CreateIndex
CREATE INDEX "goods_receipt_line_purchaseOrderLineId_idx" ON "goods_receipt_line"("purchaseOrderLineId");

-- CreateIndex
CREATE INDEX "goods_receipt_line_departmentId_idx" ON "goods_receipt_line"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipt_line_goodsReceiptId_lineNo_key" ON "goods_receipt_line"("goodsReceiptId", "lineNo");

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_line" ADD CONSTRAINT "goods_receipt_line_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_line" ADD CONSTRAINT "goods_receipt_line_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "purchase_order_line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_line" ADD CONSTRAINT "goods_receipt_line_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

