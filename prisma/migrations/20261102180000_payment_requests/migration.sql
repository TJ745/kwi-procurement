-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('BANK_TRANSFER', 'CHEQUE', 'PETTY_CASH');

-- CreateEnum
CREATE TYPE "PaymentPriority" AS ENUM ('NORMAL', 'URGENT', 'TOP_URGENT');

-- CreateTable
CREATE TABLE "payment_request" (
    "id" TEXT NOT NULL,
    "number" CITEXT NOT NULL,
    "requestDate" DATE NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "purchaseOrderId" TEXT,
    "projectId" TEXT NOT NULL,
    "supplierId" TEXT,
    "inFavorOf" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "items" TEXT[],
    "otherDetails" TEXT,
    "paymentType" "PaymentType" NOT NULL,
    "priority" "PaymentPriority" NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(18,3) NOT NULL,
    "invoiceNo" TEXT,
    "quotationNo" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_request_number_key" ON "payment_request"("number");

-- CreateIndex
CREATE INDEX "payment_request_purchaseOrderId_idx" ON "payment_request"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "payment_request_projectId_idx" ON "payment_request"("projectId");

-- CreateIndex
CREATE INDEX "payment_request_supplierId_idx" ON "payment_request"("supplierId");

-- CreateIndex
CREATE INDEX "payment_request_createdById_idx" ON "payment_request"("createdById");

-- CreateIndex
CREATE INDEX "payment_request_status_idx" ON "payment_request"("status");

-- CreateIndex
CREATE INDEX "payment_request_requestDate_idx" ON "payment_request"("requestDate");

-- AddForeignKey
ALTER TABLE "payment_request" ADD CONSTRAINT "payment_request_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_request" ADD CONSTRAINT "payment_request_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_request" ADD CONSTRAINT "payment_request_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_request" ADD CONSTRAINT "payment_request_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

