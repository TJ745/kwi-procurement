import type { Metadata } from "next";

import { PrintDocument, PrintTable, truncationNote } from "@/components/print/print-document";
import { listRoles } from "@/lib/data/admin";
import { parseListParams, printParams } from "@/lib/data/list-params";
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
  type Permission,
  normalizePermissions,
} from "@/lib/permissions";
import { describeFilters } from "@/lib/print";
import { requireSuperAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Print · Roles" };

function summarize(permissions: string[]) {
  const granted = new Set(normalizePermissions(permissions));
  return PERMISSION_MODULES.flatMap((module) => {
    const actions = (module.actions as readonly (keyof typeof PERMISSION_ACTION_LABELS)[]).filter((action) =>
      granted.has(`${module.key}:${action}` as Permission),
    );
    return actions.length ? [`${module.label}: ${actions.map((a) => PERMISSION_ACTION_LABELS[a]).join(", ")}`] : [];
  });
}

export default async function Page({ searchParams }: PageProps<"/print/roles">) {
  const { settings, formatDate } = await requireSuperAdmin();
  const params = parseListParams(await searchParams);
  const result = await listRoles(printParams(params));
  return (
    <PrintDocument title="Roles" filters={describeFilters(params)} summary={truncationNote(result.items.length, result.total)} settings={settings} generatedAt={formatDate.dateTime(new Date())}>
      <PrintTable
        rows={result.items}
        rowKey={(row) => row.id}
        columns={[
          { header: "#", cell: (_row, index) => index + 1, className: "w-8" },
          { header: "Role", cell: (row) => row.name },
          { header: "Description", cell: (row) => row.description ?? "" },
          { header: "Permissions", cell: (row) => summarize(row.permissions).join("; ") || "None" },
          { header: "Users", cell: (row) => row._count.users, align: "right" },
        ]}
      />
    </PrintDocument>
  );
}
