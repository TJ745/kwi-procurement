export const ROLES = {
  SUPER_ADMIN: "super_admin",
  USER: "user",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.USER]: "User",
};

export function isSuperAdmin(role: string | null | undefined) {
  return role === ROLES.SUPER_ADMIN;
}

export function getRoleLabel(role: string | null | undefined) {
  return role && role in ROLE_LABELS ? ROLE_LABELS[role as Role] : "User";
}
