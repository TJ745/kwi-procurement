import type { Metadata } from "next";

import { PrintDocument, PrintTable, truncationNote } from "@/components/print/print-document";
import { parseListParams, printParams } from "@/lib/data/list-params";
import { listPaymentRequests, parsePaymentRequestStatus } from "@/lib/data/payment-requests";
import { formatMoney } from "@/lib/money";
import { PAYMENT_REQUEST_STATUS_LABELS, priorityLabel } from "@/lib/payment-request-options";
import { describeFilters } from "@/lib/print";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Print · Payment Requests" };

export default async function Page({ searchParams }: PageProps<"/print/payment-requests">) {
  const { settings, formatDate } = await requirePermission("payment_requests:view");
  const raw = await searchParams;
  const params = parseListParams(raw);
  const status = parsePaymentRequestStatus(raw.status);
  const result = await listPaymentRequests(printParams(params), status);
  return (
    <PrintDocument
      title="Payment Requests"
      filters={describeFilters(params, [status && `Status: ${PAYMENT_REQUEST_STATUS_LABELS[status]}`])}
      summary={truncationNote(result.items.length, result.total)}
      settings={settings}
      generatedAt={formatDate.dateTime(new Date())}
    >
      <PrintTable
        rows={result.items}
        rowKey={(row) => row.id}
        columns={[
          { header: "#", cell: (_row, index) => index + 1, className: "w-8" },
          { header: "PR No", cell: (row) => row.number },
          { header: "Date", cell: (row) => formatDate.calendarDate(row.requestDate) },
          { header: "In favor of", cell: (row) => row.inFavorOf },
          { header: "Project", cell: (row) => row.project.code },
          { header: "PO Ref", cell: (row) => row.purchaseOrder?.number ?? "" },
          { header: "Priority", cell: (row) => priorityLabel(row.priority) },
          { header: "Amount", cell: (row) => formatMoney(row.amount, row.currency), align: "right" },
          { header: "Status", cell: (row) => PAYMENT_REQUEST_STATUS_LABELS[row.status] },
        ]}
      />
    </PrintDocument>
  );
}
