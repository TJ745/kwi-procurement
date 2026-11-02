"use server";

import { z } from "zod";

import { ActionError, runMutation } from "@/lib/actions/run-mutation";
import { normalizePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { roleSchema } from "@/lib/validation/admin";
import { recordIdSchema } from "@/lib/validation/master-data";

const unique = { field: "name", message: "A role with this name already exists." };

function toRoleData(input: z.infer<typeof roleSchema>) {
  return {
    name: input.name,
    description: input.description || null,
    permissions: normalizePermissions(input.permissions),
  };
}

export async function createRole(input: unknown) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "role", action: "create" },
    schema: roleSchema,
    input,
    unique,
    success: "Role created.",
    run: (data) => prisma.role.create({ data: toRoleData(data) }),
  });
}

export async function updateRole(id: string, input: unknown) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "role", action: "update" },
    schema: roleSchema.extend({ id: recordIdSchema }),
    input: { ...(input as object), id },
    unique,
    success: "Role updated. Changes apply to its users immediately.",
    run: ({ id, ...data }) => prisma.role.update({ where: { id }, data: toRoleData(data) }),
  });
}

export async function deleteRole(id: string) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "role", action: "delete" },
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Role deleted.",
    run: async ({ id }) => {
      const users = await prisma.user.count({ where: { roleId: id } });
      if (users > 0) {
        throw new ActionError(
          `This role is assigned to ${users} user${users === 1 ? "" : "s"}. Assign them another role first.`,
        );
      }
      await prisma.role.delete({ where: { id } });
    },
  });
}
