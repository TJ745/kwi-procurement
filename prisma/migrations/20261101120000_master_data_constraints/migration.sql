-- Case-insensitive text type used for unique master-data names and codes.
CREATE EXTENSION IF NOT EXISTS citext;

-- AlterTable
ALTER TABLE "category" ALTER COLUMN "name" SET DATA TYPE CITEXT;

-- AlterTable
ALTER TABLE "department" ALTER COLUMN "name" SET DATA TYPE CITEXT;

-- AlterTable
ALTER TABLE "project" ALTER COLUMN "code" SET DATA TYPE CITEXT;

-- CreateIndex
CREATE UNIQUE INDEX "supplier_vat_key" ON "supplier"("vat");
