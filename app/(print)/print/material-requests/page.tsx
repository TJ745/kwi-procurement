import type { Metadata } from "next";

import { PrintDocument, PrintTable, truncationNote } from "@/components/print/print-document";
import { parseListParams, printParams } from "@/lib/data/list-params";
import { listMaterialRequests, parseStatusFilter } from "@/lib/data/material-requests";
import { describeFilters } from "@/lib/print";
import { requirePermission } from "@/lib/session";
import { MATERIAL_REQUEST_STATUS_LABELS } from "@/lib/validation/material-request";

export const metadata: Metadata = { title: "Print · Material Requests" };

export default async function Page({ searchParams }: PageProps<"/print/material-requests">) {
  const { settings, formatDate } = await requirePermission("material_requests:view");
  const raw = await searchParams;
  const params = parseListParams(raw);
  const status = parseStatusFilter(raw.status);
  const result = await listMaterialRequests(printParams(params), status);
  return (
    <PrintDocument
      title="Material Requests"
      filters={describeFilters(params, [status && `Status: ${MATERIAL_REQUEST_STATUS_LABELS[status]}`])}
      summary={truncationNote(result.items.length, result.total)}
      settings={settings}
      generatedAt={formatDate.dateTime(new Date())}
    >
      <PrintTable
        rows={result.items}
        rowKey={(row) => row.id}
        columns={[
          { header: "#", cell: (_row, index) => index + 1, className: "w-8" },
          { header: "Request No", cell: (row) => row.number },
          { header: "Date", cell: (row) => formatDate.calendarDate(row.requestDate) },
          { header: "Project", cell: (row) => `${row.project.code} – ${row.project.name}` },
          { header: "Requested by", cell: (row) => row.department.name },
          { header: "Category", cell: (row) => row.category.name },
          { header: "Lines", cell: (row) => row._count.lines, align: "right" },
          { header: "Status", cell: (row) => MATERIAL_REQUEST_STATUS_LABELS[row.status] },
        ]}
      />
    </PrintDocument>
  );
}
