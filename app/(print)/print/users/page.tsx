import type { Metadata } from "next";

import { PrintDocument, PrintTable, truncationNote } from "@/components/print/print-document";
import { listUsers } from "@/lib/data/admin";
import { parseListParams, printParams } from "@/lib/data/list-params";
import { describeFilters } from "@/lib/print";
import { isSuperAdmin } from "@/lib/roles";
import { requireSuperAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Print · Users" };

export default async function Page({ searchParams }: PageProps<"/print/users">) {
  const { settings, formatDate } = await requireSuperAdmin();
  const params = parseListParams(await searchParams);
  const result = await listUsers(printParams(params));
  return (
    <PrintDocument title="Users" filters={describeFilters(params)} summary={truncationNote(result.items.length, result.total)} settings={settings} generatedAt={formatDate.dateTime(new Date())}>
      <PrintTable
        rows={result.items}
        rowKey={(row) => row.id}
        columns={[
          { header: "#", cell: (_row, index) => index + 1, className: "w-8" },
          { header: "Name", cell: (row) => row.name },
          { header: "Email", cell: (row) => row.email },
          { header: "Role", cell: (row) => (isSuperAdmin(row.role) ? "Super Admin" : (row.customRole?.name ?? "No role")) },
          { header: "Status", cell: (row) => (row.active ? "Active" : "Deactivated") },
          { header: "Created", cell: (row) => formatDate.date(row.createdAt) },
        ]}
      />
    </PrintDocument>
  );
}
