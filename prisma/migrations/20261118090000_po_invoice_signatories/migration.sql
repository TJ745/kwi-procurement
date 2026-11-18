-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "signatories" JSONB;

-- AlterTable
ALTER TABLE "purchase_order" ADD COLUMN     "invoiceNo" TEXT;
