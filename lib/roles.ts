/**
 * Built-in system roles stored in `user.role`. Access for ordinary users is
 * defined by their custom role (see lib/permissions.ts).
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  USER: "user",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function isSuperAdmin(role: string | null | undefined) {
  return role === ROLES.SUPER_ADMIN;
}
