/** Display labels for audit log filters and badges (client-safe). */

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  status: "Status changed",
  activate: "Reactivated",
  deactivate: "Deactivated",
  password_reset: "Password reset",
  password_change: "Password changed",
  sign_in: "Signed in",
  sign_in_failed: "Failed sign-in",
  sign_out: "Signed out",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  project: "Project",
  supplier: "Supplier",
  department: "Department",
  category: "Category",
  material_request: "Material request",
  purchase_order: "Purchase order",
  payment_request: "Payment request",
  grn: "GRN",
  user: "User",
  role: "Role",
  settings: "Settings",
  document_sequence: "Document numbering",
  auth: "Sign-in",
};

export const AUDIT_PERIODS: Record<string, { label: string; days: number }> = {
  "1": { label: "Last 24 hours", days: 1 },
  "7": { label: "Last 7 days", days: 7 },
  "30": { label: "Last 30 days", days: 30 },
  "90": { label: "Last 90 days", days: 90 },
};

/** In-app link for an audited record, when one exists. */
export function auditRecordHref(entityType: string, entityId: string | null, label: string | null) {
  if (!entityId) return null;
  const q = encodeURIComponent(label ?? "");
  switch (entityType) {
    case "material_request":
      return `/material-requests/${entityId}`;
    case "purchase_order":
      return `/purchase-orders/${entityId}`;
    case "payment_request":
      return `/payment-requests/${entityId}`;
    case "grn":
      return `/grn/${entityId}`;
    case "supplier":
      return `/suppliers/${entityId}`;
    case "project":
      return `/projects?q=${q}`;
    case "department":
      return `/departments?q=${q}`;
    case "category":
      return `/categories?q=${q}`;
    case "user":
    case "auth":
      return `/users?q=${q}`;
    case "role":
      return `/roles?q=${q}`;
    case "settings":
    case "document_sequence":
      return "/settings";
    default:
      return null;
  }
}
