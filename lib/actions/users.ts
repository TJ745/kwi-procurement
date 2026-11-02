"use server";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { ActionError, runMutation } from "@/lib/actions/run-mutation";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ROLES, isSuperAdmin } from "@/lib/roles";
import { getSettings } from "@/lib/settings";
import {
  createUserSchema,
  resetPasswordSchema,
  userSchema,
} from "@/lib/validation/admin";
import { recordIdSchema } from "@/lib/validation/master-data";

const unique = { field: "email", message: "A user with this email already exists." };

/** Loads a user that may be managed from the UI (not the .env Super Admin). */
async function getManagedUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) throw new ActionError("This user no longer exists. Refresh the page.");
  if (isSuperAdmin(user.role)) {
    throw new ActionError("The Super Admin account is managed through .env and cannot be changed here.");
  }
  return user;
}

async function assertRoleExists(roleId: string) {
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
  if (!role) throw new ActionError("The selected role no longer exists.", { roleId: "Select a role." });
}

async function assertPasswordPolicy(password: string, field: string) {
  const { minPasswordLength } = await getSettings();
  if (password.length < minPasswordLength) {
    const message = `Password must be at least ${minPasswordLength} characters.`;
    throw new ActionError(message, { [field]: message });
  }
}

export async function createUser(input: unknown) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "user", action: "create" },
    schema: createUserSchema,
    input,
    unique,
    success: "User created. Share the temporary password with them securely.",
    run: async ({ temporaryPassword, roleId, ...data }) => {
      await Promise.all([
        assertRoleExists(roleId),
        assertPasswordPolicy(temporaryPassword, "temporaryPassword"),
      ]);
      const userId = randomUUID();
      const passwordHash = await hashPassword(temporaryPassword);
      await prisma.$transaction([
        prisma.user.create({
          data: {
            ...data,
            id: userId,
            role: ROLES.USER,
            roleId,
            emailVerified: true,
            mustChangePassword: true,
          },
        }),
        prisma.account.create({
          data: {
            id: randomUUID(),
            userId,
            accountId: userId,
            providerId: "credential",
            password: passwordHash,
          },
        }),
      ]);
      return { id: userId };
    },
  });
}

export async function updateUser(id: string, input: unknown) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "user", action: "update" },
    schema: userSchema.extend({ id: recordIdSchema }),
    input: { ...(input as object), id },
    unique,
    success: "User updated.",
    run: async ({ id, roleId, ...data }) => {
      await Promise.all([getManagedUser(id), assertRoleExists(roleId)]);
      await prisma.user.update({ where: { id }, data: { ...data, roleId } });
    },
  });
}

export async function resetUserPassword(id: string, input: unknown) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "user", action: "password_reset" },
    schema: resetPasswordSchema.extend({ id: recordIdSchema }),
    input: { ...(input as object), id },
    success: "Password reset. The user must choose a new password at next sign-in.",
    run: async ({ id, temporaryPassword }) => {
      await Promise.all([
        getManagedUser(id),
        assertPasswordPolicy(temporaryPassword, "temporaryPassword"),
      ]);
      const passwordHash = await hashPassword(temporaryPassword);
      const credential = await prisma.account.findFirst({
        where: { userId: id, providerId: "credential" },
        select: { id: true },
      });
      await prisma.$transaction([
        credential
          ? prisma.account.update({ where: { id: credential.id }, data: { password: passwordHash } })
          : prisma.account.create({
              data: { id: randomUUID(), userId: id, accountId: id, providerId: "credential", password: passwordHash },
            }),
        prisma.user.update({ where: { id }, data: { mustChangePassword: true } }),
        // Sign the user out everywhere.
        prisma.session.deleteMany({ where: { userId: id } }),
      ]);
    },
  });
}

export async function setUserActive(id: string, active: boolean) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "user", action: (data) => (data.active ? "activate" : "deactivate") },
    schema: z.object({ id: recordIdSchema, active: z.boolean() }),
    input: { id, active },
    success: active ? "User reactivated." : "User deactivated and signed out.",
    run: async ({ id, active }) => {
      await getManagedUser(id);
      await prisma.$transaction([
        prisma.user.update({ where: { id }, data: { active } }),
        ...(active ? [] : [prisma.session.deleteMany({ where: { userId: id } })]),
      ]);
    },
  });
}
