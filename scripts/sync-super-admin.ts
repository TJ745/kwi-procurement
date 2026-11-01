/**
 * Creates or updates the Super Admin from environment variables:
 *
 *   SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME (optional)
 *
 *   npm run sync-super-admin
 *
 * Re-run after editing these values in .env to apply them:
 * - No Super Admin yet: one is created.
 * - Super Admin with this email: name and password are updated.
 * - Exactly one Super Admin with a different email: its email is changed.
 * Changing the email or password signs the Super Admin out everywhere.
 * The command never promotes an existing ordinary user.
 */
import "dotenv/config";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  hashPassword,
  verifyPassword,
} from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/roles";

const envSchema = z.object({
  SUPER_ADMIN_EMAIL: z
    .email("SUPER_ADMIN_EMAIL must be a valid email address.")
    .trim()
    .toLowerCase(),
  SUPER_ADMIN_PASSWORD: z
    .string("SUPER_ADMIN_PASSWORD is not set.")
    .min(
      PASSWORD_MIN_LENGTH,
      `SUPER_ADMIN_PASSWORD must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    )
    .max(
      PASSWORD_MAX_LENGTH,
      `SUPER_ADMIN_PASSWORD must be at most ${PASSWORD_MAX_LENGTH} characters.`,
    ),
  SUPER_ADMIN_NAME: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((name) => name || "Super Admin"),
});

async function findTargetUser(email: string) {
  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    if (byEmail.role !== ROLES.SUPER_ADMIN) {
      throw new Error(
        `${email} belongs to an existing user who is not a Super Admin. Use a different SUPER_ADMIN_EMAIL.`,
      );
    }
    return byEmail;
  }

  const admins = await prisma.user.findMany({
    where: { role: ROLES.SUPER_ADMIN },
    take: 2,
  });
  if (admins.length > 1) {
    throw new Error(
      "More than one Super Admin exists, so it is unclear which one to update. Set SUPER_ADMIN_EMAIL to one of them.",
    );
  }
  return admins[0] ?? null;
}

async function main() {
  const env = envSchema.parse(process.env);
  const email = env.SUPER_ADMIN_EMAIL;
  const name = env.SUPER_ADMIN_NAME;
  const password = env.SUPER_ADMIN_PASSWORD;

  const user = await findTargetUser(email);

  if (!user) {
    const userId = randomUUID();
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          email,
          name,
          role: ROLES.SUPER_ADMIN,
          emailVerified: true,
        },
      }),
      // Same shape Better Auth writes for email/password credentials.
      prisma.account.create({
        data: {
          id: randomUUID(),
          userId,
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(password),
        },
      }),
    ]);
    console.log(`Super Admin created: ${email}`);
    return;
  }

  const credential = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  const passwordChanged =
    !credential?.password ||
    !(await verifyPassword(credential.password, password));
  const emailChanged = user.email !== email;
  const nameChanged = user.name !== name;

  if (!passwordChanged && !emailChanged && !nameChanged) {
    console.log(`Super Admin is already up to date: ${email}`);
    return;
  }

  const passwordHash = passwordChanged ? await hashPassword(password) : null;
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { email, name, ...(emailChanged && { emailVerified: true }) },
    }),
    ...(passwordHash
      ? [
          credential
            ? prisma.account.update({
                where: { id: credential.id },
                data: { password: passwordHash },
              })
            : prisma.account.create({
                data: {
                  id: randomUUID(),
                  userId: user.id,
                  accountId: user.id,
                  providerId: "credential",
                  password: passwordHash,
                },
              }),
        ]
      : []),
    ...(passwordChanged || emailChanged
      ? [prisma.session.deleteMany({ where: { userId: user.id } })]
      : []),
  ]);

  const changes = [
    emailChanged && `email (${user.email} -> ${email})`,
    nameChanged && "name",
    passwordChanged && "password",
  ].filter(Boolean);
  console.log(`Super Admin updated: ${changes.join(", ")}.`);
  if (passwordChanged || emailChanged) {
    console.log("Existing Super Admin sessions were signed out.");
  }
}

main()
  .catch((error: unknown) => {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((issue) => issue.message).join("\n")
        : error instanceof Error
          ? error.message
          : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
