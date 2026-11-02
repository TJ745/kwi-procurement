import type { Metadata } from "next";

import { PrintDocument, PrintTable, truncationNote } from "@/components/print/print-document";
import { parseListParams, printParams } from "@/lib/data/list-params";
import { listProjects } from "@/lib/data/master-data";
import { describeFilters } from "@/lib/print";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Print · Projects" };

export default async function Page({ searchParams }: PageProps<"/print/projects">) {
  const { settings, formatDate } = await requirePermission("projects:view");
  const params = parseListParams(await searchParams);
  const result = await listProjects(printParams(params));
  return (
    <PrintDocument title="Projects" filters={describeFilters(params)} summary={truncationNote(result.items.length, result.total)} settings={settings} generatedAt={formatDate.dateTime(new Date())}>
      <PrintTable
        rows={result.items}
        rowKey={(row) => row.id}
        columns={[
          { header: "#", cell: (_row, index) => index + 1, className: "w-10" },
          { header: "Code", cell: (row) => row.code },
          { header: "Name", cell: (row) => row.name },
          { header: "Last updated", cell: (row) => formatDate.date(row.updatedAt) },
        ]}
      />
    </PrintDocument>
  );
}
