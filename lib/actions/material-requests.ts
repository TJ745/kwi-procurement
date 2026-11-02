"use server";

import { z } from "zod";

import { ActionError, runMutation } from "@/lib/actions/run-mutation";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  notifyMaterialRequestCreated,
  notifyMaterialRequestStatusChanged,
} from "@/lib/notifications";
import { allocateDocumentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { recordIdSchema } from "@/lib/validation/master-data";
import {
  MATERIAL_REQUEST_STATUSES,
  type MaterialRequestInput,
  materialRequestSchema,
} from "@/lib/validation/material-request";

// Interactive transactions queue on the numbering row lock; allow for that.
const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

/** Confirms the selected master data still exists (for clear field errors). */
async function assertReferences(input: MaterialRequestInput) {
  const [project, department, category, supplier] = await Promise.all([
    prisma.project.count({ where: { id: input.projectId } }),
    prisma.department.count({ where: { id: input.departmentId } }),
    prisma.category.count({ where: { id: input.categoryId } }),
    input.supplierId ? prisma.supplier.count({ where: { id: input.supplierId } }) : 1,
  ]);
  const fieldErrors: Record<string, string> = {};
  if (!project) fieldErrors.projectId = "This project no longer exists.";
  if (!department) fieldErrors.departmentId = "This department no longer exists.";
  if (!category) fieldErrors.categoryId = "This category no longer exists.";
  if (!supplier) fieldErrors.supplierId = "This supplier no longer exists.";
  if (Object.keys(fieldErrors).length) {
    throw new ActionError("Some selections are no longer available.", fieldErrors);
  }
}

function toHeaderData(input: MaterialRequestInput) {
  return {
    // Stored as a calendar date (no time zone).
    requestDate: new Date(`${input.requestDate}T00:00:00.000Z`),
    projectId: input.projectId,
    departmentId: input.departmentId,
    categoryId: input.categoryId,
    supplierId: input.supplierId || null,
  };
}

function toLines(input: MaterialRequestInput) {
  return input.lines.map(
    (line, index): Omit<Prisma.MaterialRequestLineCreateManyInput, "materialRequestId"> => ({
      lineNo: index + 1,
      name: line.name,
      unit: line.unit,
      quantity: line.quantity,
      remarks: line.remarks || null,
    }),
  );
}

/** Next number that is not already in use (e.g. after the counter was lowered). */
async function allocateFreeNumber(tx: Prisma.TransactionClient, timeZone: string) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const number = await allocateDocumentNumber(tx, "MATERIAL_REQUEST", timeZone);
    const taken = await tx.materialRequest.count({ where: { number } });
    if (!taken) return number;
  }
  throw new ActionError("Could not assign a request number. Check Settings › Document numbering.");
}

export async function createMaterialRequest(input: unknown) {
  return runMutation({
    requirement: "material_requests:create",
    audit: { entity: "material_request", action: "create" },
    schema: materialRequestSchema,
    input,
    success: "Material request created.",
    // The client navigates to the new request.
    refreshPage: false,
    run: async (data, { user, settings }) => {
      await assertReferences(data);
      return prisma.$transaction(async (tx) => {
        const number = await allocateFreeNumber(tx, settings.timeZone);
        const created = await tx.materialRequest.create({
          data: {
            ...toHeaderData(data),
            number,
            createdById: user.id,
            lines: { createMany: { data: toLines(data) } },
          },
          select: { id: true },
        });
        await notifyMaterialRequestCreated(tx, { id: created.id, number }, user);
        return created;
      }, TRANSACTION_OPTIONS);
    },
  });
}

export async function updateMaterialRequest(id: string, input: unknown) {
  return runMutation({
    requirement: "material_requests:edit",
    audit: { entity: "material_request", action: "update" },
    schema: materialRequestSchema.extend({ id: recordIdSchema }),
    input: { ...(input as object), id },
    success: "Material request updated.",
    refreshPage: false,
    run: async ({ id, ...data }) => {
      await assertReferences(data);
      // Lines are replaced as a whole so Sr No stays contiguous.
      const [, , updated] = await prisma.$transaction([
        prisma.materialRequest.findUniqueOrThrow({ where: { id }, select: { id: true } }),
        prisma.materialRequestLine.deleteMany({ where: { materialRequestId: id } }),
        prisma.materialRequest.update({
          where: { id },
          data: { ...toHeaderData(data), lines: { createMany: { data: toLines(data) } } },
          select: { id: true },
        }),
      ]);
      return updated;
    },
  });
}

const statusSchema = z.enum(MATERIAL_REQUEST_STATUSES);

export async function setMaterialRequestStatus(id: string, status: string) {
  return runMutation({
    requirement: "material_requests:status",
    audit: { entity: "material_request", action: "status" },
    schema: z.object({ id: recordIdSchema, status: statusSchema }),
    input: { id, status },
    success: "Status updated.",
    run: ({ id, status }, { user }) =>
      prisma.$transaction(async (tx) => {
        const current = await tx.materialRequest.findUniqueOrThrow({
          where: { id },
          select: { id: true, number: true, status: true, createdById: true },
        });
        if (current.status === status) return current;
        await tx.materialRequest.update({ where: { id }, data: { status } });
        await notifyMaterialRequestStatusChanged(tx, current, status, user);
        return current;
      }, TRANSACTION_OPTIONS),
  });
}

async function deleteUnlessApproved(id: string) {
  // The status check is part of the delete, so a concurrent approval wins.
  const { count } = await prisma.materialRequest.deleteMany({
    where: { id, status: { not: "APPROVED" } },
  });
  if (count === 0) {
    const exists = await prisma.materialRequest.count({ where: { id } });
    throw new ActionError(
      exists
        ? "Approved requests cannot be deleted."
        : "This request no longer exists. Refresh the page.",
    );
  }
}

export async function deleteMaterialRequest(id: string) {
  return runMutation({
    requirement: "material_requests:delete",
    audit: { entity: "material_request", action: "delete" },
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Material request deleted.",
    run: ({ id }) => deleteUnlessApproved(id),
  });
}

/** Used on the detail page, which navigates back to the list itself. */
export async function deleteMaterialRequestFromDetail(id: string) {
  return runMutation({
    requirement: "material_requests:delete",
    audit: { entity: "material_request", action: "delete" },
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Material request deleted.",
    refreshPage: false,
    run: ({ id }) => deleteUnlessApproved(id),
  });
}
