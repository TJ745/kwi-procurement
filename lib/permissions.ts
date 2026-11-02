/**
 * Permissions that can be granted to custom roles.
 *
 * The Super Admin has every permission implicitly. Users, Roles and Settings
 * are not listed here: they are restricted to the Super Admin.
 * Permissions for further workflows are added as each workflow is built.
 */
export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "status"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  status: "Change status",
};

const CRUD = ["view", "create", "edit", "delete"] as const;

export const PERMISSION_MODULES = [
  { key: "projects", label: "Projects", href: "/projects", actions: CRUD },
  { key: "suppliers", label: "Suppliers", href: "/suppliers", actions: CRUD },
  { key: "departments", label: "Departments", href: "/departments", actions: CRUD },
  { key: "categories", label: "Categories", href: "/categories", actions: CRUD },
  {
    key: "material_requests",
    label: "Material Request",
    href: "/material-requests",
    actions: [...CRUD, "status"],
  },
] as const satisfies readonly {
  key: string;
  label: string;
  href: string;
  actions: readonly PermissionAction[];
}[];

type Module = (typeof PERMISSION_MODULES)[number];
export type PermissionModule = Module["key"];
export type Permission = {
  [M in Module as M["key"]]: `${M["key"]}:${M["actions"][number]}`;
}[PermissionModule];

export const ALL_PERMISSIONS = PERMISSION_MODULES.flatMap((module) =>
  module.actions.map((action) => `${module.key}:${action}` as Permission),
) as [Permission, ...Permission[]];

const KNOWN = new Set<string>(ALL_PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return KNOWN.has(value);
}

/**
 * Drops unknown keys, de-duplicates, and adds "view" for any module that has
 * another action (those actions are meaningless without viewing).
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
