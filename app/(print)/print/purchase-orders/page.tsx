import type { Metadata } from "next";

import { PrintDocument, PrintTable, truncationNote } from "@/components/print/print-document";
import { parseListParams, printParams } from "@/lib/data/list-params";
import { listPurchaseOrders, parsePurchaseOrderStatus } from "@/lib/data/purchase-orders";
import { formatMoney } from "@/lib/money";
import { describeFilters } from "@/lib/print";
import { requirePermission } from "@/lib/session";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/validation/purchase-order";

export const metadata: Metadata = { title: "Print · Purchase Orders" };

export default async function Page({ searchParams }: PageProps<"/print/purchase-orders">) {
  const { settings, formatDate } = await requirePermission("purchase_orders:view");
  const raw = await searchParams;
  const params = parseListParams(raw);
  const status = parsePurchaseOrderStatus(raw.status);
  const result = await listPurchaseOrders(printParams(params), status);
  return (
    <PrintDocument
      title="Purchase Orders"
      filters={describeFilters(params, [status && `Status: ${PURCHASE_ORDER_STATUS_LABELS[status]}`])}
      summary={truncationNote(result.items.length, result.total)}
      settings={settings}
      generatedAt={formatDate.dateTime(new Date())}
    >
      <PrintTable
        rows={result.items}
        rowKey={(row) => row.id}
        columns={[
          { header: "#", cell: (_row, index) => index + 1, className: "w-8" },
          { header: "PO No", cell: (row) => row.number },
          { header: "Date", cell: (row) => formatDate.calendarDate(row.orderDate) },
          { header: "Supplier", cell: (row) => row.supplierName },
          { header: "Subject", cell: (row) => row.category.name },
          { header: "Project", cell: (row) => row.project.code },
          { header: "MR No", cell: (row) => row.materialRequest?.number ?? "" },
          { header: "Total", cell: (row) => formatMoney(row.total, row.currency), align: "right" },
          { header: "Status", cell: (row) => PURCHASE_ORDER_STATUS_LABELS[row.status] },
        ]}
      />
    </PrintDocument>
  );
}
