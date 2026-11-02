import type { Metadata } from "next";

import { PrintDocument, PrintTable, truncationNote } from "@/components/print/print-document";
import { listGrns, parseGrnStatus } from "@/lib/data/grns";
import { parseListParams, printParams } from "@/lib/data/list-params";
import { GRN_STATUS_LABELS, deliveryMethodLabel } from "@/lib/grn";
import { describeFilters } from "@/lib/print";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Print · Goods Received Notes" };

export default async function Page({ searchParams }: PageProps<"/print/grn">) {
  const { settings, formatDate } = await requirePermission("grns:view");
  const raw = await searchParams;
  const params = parseListParams(raw);
  const status = parseGrnStatus(raw.status);
  const result = await listGrns(printParams(params), status);
  return (
    <PrintDocument
      title="Goods Received Notes"
      filters={describeFilters(params, [status && `Status: ${GRN_STATUS_LABELS[status]}`])}
      summary={truncationNote(result.items.length, result.total)}
      settings={settings}
      generatedAt={formatDate.dateTime(new Date())}
    >
      <PrintTable
        rows={result.items}
        rowKey={(row) => row.id}
        columns={[
          { header: "#", cell: (_row, index) => index + 1, className: "w-8" },
          { header: "GRN No", cell: (row) => row.number },
          { header: "Date", cell: (row) => formatDate.calendarDate(row.receiptDate) },
          { header: "From", cell: (row) => row.supplierName },
          { header: "PO Ref", cell: (row) => row.purchaseOrder.number },
          { header: "Project", cell: (row) => row.project.code },
          { header: "Delivered by", cell: (row) => deliveryMethodLabel(row.deliveredBy) },
          { header: "Items", cell: (row) => row._count.lines, align: "right" },
          { header: "Status", cell: (row) => GRN_STATUS_LABELS[row.status] },
        ]}
      />
    </PrintDocument>
  );
}
