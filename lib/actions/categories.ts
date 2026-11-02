"use server";

import { z } from "zod";

import { runMutation } from "@/lib/actions/run-mutation";
import { prisma } from "@/lib/prisma";
import { categorySchema, recordIdSchema } from "@/lib/validation/master-data";

const unique = { field: "name", message: "A category with this name already exists." };

export async function createCategory(input: unknown) {
  return runMutation({
    requirement: "categories:create",
    audit: { entity: "category", action: "create" },
    schema: categorySchema,
    input,
    unique,
    success: "Category created.",
    run: (data) => prisma.category.create({ data }),
  });
}

export async function updateCategory(id: string, input: unknown) {
  return runMutation({
    requirement: "categories:edit",
    audit: { entity: "category", action: "update" },
    schema: categorySchema.extend({ id: recordIdSchema }),
    input: { ...(input as object), id },
    unique,
    success: "Category updated.",
    run: ({ id, ...data }) => prisma.category.update({ where: { id }, data }),
  });
}

export async function deleteCategory(id: string) {
  return runMutation({
    requirement: "categories:delete",
    audit: { entity: "category", action: "delete" },
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Category deleted.",
    run: ({ id }) => prisma.category.delete({ where: { id } }),
  });
}
