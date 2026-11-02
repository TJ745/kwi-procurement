-- CreateEnum
CREATE TYPE "SupplierPaymentTerm" AS ENUM ('CASH', 'CREDIT');

-- AlterTable
ALTER TABLE "supplier" ADD COLUMN     "creditDays" INTEGER,
ADD COLUMN     "paymentTerm" "SupplierPaymentTerm" NOT NULL DEFAULT 'CASH';

