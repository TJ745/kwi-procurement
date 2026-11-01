import { isSuperAdmin } from "@/lib/roles";

/**
 * Master data (projects, suppliers, departments, categories) is readable by
 * every signed-in user and writable only by the Super Admin.
 */
export function canManageMasterData(role: string | null | undefined) {
  return isSuperAdmin(role);
}
