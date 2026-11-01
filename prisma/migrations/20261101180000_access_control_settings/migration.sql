-- AlterTable
ALTER TABLE "user" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roleId" TEXT;

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" CITEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "companyVat" TEXT,
    "companyCr" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "companyLogo" BYTEA,
    "companyLogoType" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "dateFormat" TEXT NOT NULL DEFAULT 'd MMM yyyy',
    "sessionDurationHours" INTEGER NOT NULL DEFAULT 168,
    "minPasswordLength" INTEGER NOT NULL DEFAULT 12,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sequence" (
    "type" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "includeYear" BOOLEAN NOT NULL DEFAULT true,
    "resetYearly" BOOLEAN NOT NULL DEFAULT true,
    "padding" INTEGER NOT NULL DEFAULT 4,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "counterYear" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_sequence_pkey" PRIMARY KEY ("type")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE INDEX "user_roleId_idx" ON "user"("roleId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Seed: the single settings row and the default document numbering.
-- Prefixes are defaults and can be changed in Settings > Document numbering.
INSERT INTO "app_settings" ("id", "updatedAt") VALUES (1, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "document_sequence" ("type", "prefix", "updatedAt") VALUES
  ('MATERIAL_REQUEST', 'MR', CURRENT_TIMESTAMP),
  ('PURCHASE_ORDER', 'PO', CURRENT_TIMESTAMP),
  ('PAYMENT_REQUEST', 'PR', CURRENT_TIMESTAMP),
  ('GRN', 'GRN', CURRENT_TIMESTAMP)
ON CONFLICT ("type") DO NOTHING;
