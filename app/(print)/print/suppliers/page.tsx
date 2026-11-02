import type { Metadata } from "next";

import { PrintDocument, PrintTable, truncationNote } from "@/components/print/print-document";
import { parseListParams, printParams } from "@/lib/data/list-params";
import { listSuppliers, parseSupplierTerm } from "@/lib/data/master-data";
import { describeFilters } from "@/lib/print";
import { requirePermission } from "@/lib/session";
import { paymentTermLabel } from "@/lib/validation/master-data";

export const metadata: Metadata = { title: "Print · Suppliers" };

export default async function Page({ searchParams }: PageProps<"/print/suppliers">) {
  const { settings, formatDate } = await requirePermission("suppliers:view");
  const raw = await searchParams;
  const params = parseListParams(raw);
  const term = parseSupplierTerm(raw.term);
  const result = await listSuppliers(printParams(params), term);
  return (
    <PrintDocument
      title="Suppliers"
      filters={describeFilters(params, [term && `Terms: ${term === "CASH" ? "Cash" : "Credit"}`])}
      summary={truncationNote(result.items.length, result.total)}
      settings={settings}
      generatedAt={formatDate.dateTime(new Date())}
    >
      <PrintTable
        rows={result.items}
        rowKey={(row) => row.id}
        columns={[
          { header: "#", cell: (_row, index) => index + 1, className: "w-8" },
          { header: "Name", cell: (row) => row.name },
          { header: "Terms", cell: (row) => paymentTermLabel(row.paymentTerm, row.creditDays) },
          { header: "VAT", cell: (row) => row.vat ?? "" },
          { header: "CR", cell: (row) => row.cr ?? "" },
          { header: "Contact", cell: (row) => [row.contactName, row.contactNumber].filter(Boolean).join(" · ") },
          { header: "Email", cell: (row) => row.email ?? row.contactEmail ?? "" },
          { header: "Telephone", cell: (row) => row.telephone ?? "" },
          { header: "Address", cell: (row) => row.address ?? "", className: "whitespace-pre-line" },
        ]}
      />
    </PrintDocument>
  );
}
