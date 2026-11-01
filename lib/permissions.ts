/**
 * Permissions that can be granted to custom roles.
 *
 * The Super Admin has every permission implicitly. Users, Roles and Settings
 * are not listed here: they are restricted to the Super Admin.
 * Procurement workflow permissions are added when each workflow is built.
 */
export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

export const PERMISSION_MODULES = [
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "suppliers", label: "Suppliers", href: "/suppliers" },
  { key: "departments", label: "Departments", href: "/departments" },
  { key: "categories", label: "Categories", href: "/categories" },
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number]["key"];
export type Permission = `${PermissionModule}:${PermissionAction}`;

export const ALL_PERMISSIONS: Permission[] = PERMISSION_MODULES.flatMap((module) =>
  PERMISSION_ACTIONS.map((action) => `${module.key}:${action}` as const),
);

const KNOWN = new Set<string>(ALL_PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return KNOWN.has(value);
}

/**
 * Drops unknown keys, de-duplicates, and adds "view" for any module that has
 * create/edit/delete (those actions are meaningless without viewing).
 */
export function normalizePermissions(values: readonly string[]): Permission[] {
  const result = new Set<Permission>();
  for (const value of values) {
    if (!isPermission(value)) continue;
    result.add(value);
    const [module] = value.split(":") as [PermissionModule];
    result.add(`${module}:view`);
  }
  return ALL_PERMISSIONS.filter((permission) => result.has(permission));
}

/** Permissions required to see a nav entry, keyed by href. */
export const NAV_PERMISSIONS: Partial<Record<string, Permission>> = Object.fromEntries(
  PERMISSION_MODULES.map((module) => [module.href, `${module.key}:view` as const]),
);
