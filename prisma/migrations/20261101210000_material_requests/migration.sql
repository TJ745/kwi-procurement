-- CreateEnum
CREATE TYPE "MaterialRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "material_request" (
    "id" TEXT NOT NULL,
    "number" CITEXT NOT NULL,
    "requestDate" DATE NOT NULL,
    "status" "MaterialRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "projectId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "supplierId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_request_line" (
    "id" TEXT NOT NULL,
    "materialRequestId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "material_request_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_request_number_key" ON "material_request"("number");

-- CreateIndex
CREATE INDEX "material_request_projectId_idx" ON "material_request"("projectId");

-- CreateIndex
CREATE INDEX "material_request_departmentId_idx" ON "material_request"("departmentId");

-- CreateIndex
CREATE INDEX "material_request_categoryId_idx" ON "material_request"("categoryId");

-- CreateIndex
CREATE INDEX "material_request_supplierId_idx" ON "material_request"("supplierId");

-- CreateIndex
CREATE INDEX "material_request_createdById_idx" ON "material_request"("createdById");

-- CreateIndex
CREATE INDEX "material_request_status_idx" ON "material_request"("status");

-- CreateIndex
CREATE INDEX "material_request_requestDate_idx" ON "material_request"("requestDate");

-- CreateIndex
CREATE UNIQUE INDEX "material_request_line_materialRequestId_lineNo_key" ON "material_request_line"("materialRequestId", "lineNo");

-- AddForeignKey
ALTER TABLE "material_request" ADD CONSTRAINT "material_request_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request" ADD CONSTRAINT "material_request_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request" ADD CONSTRAINT "material_request_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request" ADD CONSTRAINT "material_request_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request" ADD CONSTRAINT "material_request_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request_line" ADD CONSTRAINT "material_request_line_materialRequestId_fkey" FOREIGN KEY ("materialRequestId") REFERENCES "material_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

