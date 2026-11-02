import type { Metadata } from "next";

import { PrintDocument, PrintTable, truncationNote } from "@/components/print/print-document";
import { parseListParams, printParams } from "@/lib/data/list-params";
import { listCategories } from "@/lib/data/master-data";
import { describeFilters } from "@/lib/print";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Print · Categories" };

export default async function Page({ searchParams }: PageProps<"/print/categories">) {
  const { settings, formatDate } = await requirePermission("categories:view");
  const params = parseListParams(await searchParams);
  const result = await listCategories(printParams(params));
  return (
    <PrintDocument title="Categories" filters={describeFilters(params)} summary={truncationNote(result.items.length, result.total)} settings={settings} generatedAt={formatDate.dateTime(new Date())}>
      <PrintTable
        rows={result.items}
        rowKey={(row) => row.id}
        columns={[
          { header: "#", cell: (_row, index) => index + 1, className: "w-10" },
          { header: "Name", cell: (row) => row.name },
          { header: "Last updated", cell: (row) => formatDate.date(row.updatedAt) },
        ]}
      />
    </PrintDocument>
  );
}
