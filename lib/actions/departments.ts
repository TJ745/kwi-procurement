"use server";

import { z } from "zod";

import { runMutation } from "@/lib/actions/run-mutation";
import { prisma } from "@/lib/prisma";
import { departmentSchema, recordIdSchema } from "@/lib/validation/master-data";

const unique = { field: "name", message: "A department with this name already exists." };

export async function createDepartment(input: unknown) {
  return runMutation({
    requirement: "departments:create",
    schema: departmentSchema,
    input,
    unique,
    success: "Department created.",
    run: (data) => prisma.department.create({ data }),
  });
}

export async function updateDepartment(id: string, input: unknown) {
  return runMutation({
    requirement: "departments:edit",
    schema: departmentSchema.extend({ id: recordIdSchema }),
    input: { ...(input as object), id },
    unique,
    success: "Department updated.",
    run: ({ id, ...data }) => prisma.department.update({ where: { id }, data }),
  });
}

export async function deleteDepartment(id: string) {
  return runMutation({
    requirement: "departments:delete",
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Department deleted.",
    run: ({ id }) => prisma.department.delete({ where: { id } }),
  });
}
