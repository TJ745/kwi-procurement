-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ISSUED', 'CLOSED');

-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "defaultVatRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "purchaseOrderTerms" TEXT;

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" TEXT NOT NULL,
    "number" CITEXT NOT NULL,
    "orderDate" DATE NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "materialRequestId" TEXT,
    "projectId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "deliverTo" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierAddress" TEXT,
    "supplierContactName" TEXT,
    "supplierContactNumber" TEXT,
    "supplierEmail" TEXT,
    "supplierTelephone" TEXT,
    "supplierVat" TEXT,
    "quotationRef" TEXT,
    "currency" TEXT NOT NULL,
    "subtotal" DECIMAL(18,3) NOT NULL,
    "discount" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "vatAmount" DECIMAL(18,3) NOT NULL,
    "total" DECIMAL(18,3) NOT NULL,
    "terms" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_line" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,
    "unitPrice" DECIMAL(18,3) NOT NULL,
    "total" DECIMAL(18,3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "purchase_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_number_key" ON "purchase_order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_materialRequestId_key" ON "purchase_order"("materialRequestId");

-- CreateIndex
CREATE INDEX "purchase_order_projectId_idx" ON "purchase_order"("projectId");

-- CreateIndex
CREATE INDEX "purchase_order_departmentId_idx" ON "purchase_order"("departmentId");

-- CreateIndex
CREATE INDEX "purchase_order_categoryId_idx" ON "purchase_order"("categoryId");

-- CreateIndex
CREATE INDEX "purchase_order_supplierId_idx" ON "purchase_order"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_order_createdById_idx" ON "purchase_order"("createdById");

-- CreateIndex
CREATE INDEX "purchase_order_status_idx" ON "purchase_order"("status");

-- CreateIndex
CREATE INDEX "purchase_order_orderDate_idx" ON "purchase_order"("orderDate");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_line_purchaseOrderId_lineNo_key" ON "purchase_order_line"("purchaseOrderId", "lineNo");

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_materialRequestId_fkey" FOREIGN KEY ("materialRequestId") REFERENCES "material_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_line" ADD CONSTRAINT "purchase_order_line_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

