"use server";

import { z } from "zod";

import { runMutation } from "@/lib/actions/run-mutation";
import { prisma } from "@/lib/prisma";
import { projectSchema, recordIdSchema } from "@/lib/validation/master-data";

const unique = { field: "code", message: "A project with this code already exists." };

export async function createProject(input: unknown) {
  return runMutation({
    requirement: "projects:create",
    schema: projectSchema,
    input,
    unique,
    success: "Project created.",
    run: (data) => prisma.project.create({ data }),
  });
}

export async function updateProject(id: string, input: unknown) {
  return runMutation({
    requirement: "projects:edit",
    schema: projectSchema.extend({ id: recordIdSchema }),
    input: { ...(input as object), id },
    unique,
    success: "Project updated.",
    run: ({ id, ...data }) => prisma.project.update({ where: { id }, data }),
  });
}

export async function deleteProject(id: string) {
  return runMutation({
    requirement: "projects:delete",
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Project deleted.",
    run: ({ id }) => prisma.project.delete({ where: { id } }),
  });
}
