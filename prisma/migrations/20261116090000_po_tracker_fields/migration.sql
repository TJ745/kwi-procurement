-- AlterTable
ALTER TABLE "goods_receipt" ADD COLUMN     "deliveryNote" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payment_request" ADD COLUMN     "claimNo" TEXT,
ADD COLUMN     "financeSubmittedOn" DATE,
ADD COLUMN     "invoiceSubmittedOn" DATE;

-- AlterTable
ALTER TABLE "project" ADD COLUMN     "client" TEXT;
