import { PrintToolbar } from "@/components/print/print-toolbar";
import type { Settings } from "@/lib/settings";

type PrintDocumentProps = {
  title: string;
  /** Active filters, e.g. ["Search: steel", "Status: Approved"]. */
  filters?: string[];
  /** Row count line, e.g. "42 records". */
  summary?: string;
  settings: Settings;
  generatedAt: string;
  children: React.ReactNode;
};

/** Printable page with the company header, title and filters (always light). */
export function PrintDocument({ title, filters = [], summary, settings, generatedAt, children }: PrintDocumentProps) {
  const logoUrl = settings.companyLogoType ? `/api/settings/logo?v=${settings.updatedAt.getTime()}` : null;
  const registration = [settings.companyVat && `VAT: ${settings.companyVat}`, settings.companyCr && `CR: ${settings.companyCr}`]
    .filter(Boolean)
    .join("   ");

  return (
    <div className="print-sheet min-h-svh p-6 text-[12px] print:p-0">
      <PrintToolbar />
      <header className="mb-4 flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-3">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- authenticated, user-uploaded image */}
          {logoUrl && <img src={logoUrl} alt="" className="size-14 object-contain" />}
          <div>
            <p className="text-base font-bold">{settings.companyName ?? "Procurement Management"}</p>
            {settings.companyAddress && <p className="whitespace-pre-line text-neutral-600">{settings.companyAddress}</p>}
            {registration && <p className="text-neutral-600">{registration}</p>}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-lg font-bold tracking-wide uppercase">{title}</h1>
          {summary && <p className="text-neutral-600">{summary}</p>}
          <p className="text-neutral-600">Printed {generatedAt}</p>
        </div>
      </header>
      {filters.length > 0 && (
        <p className="mb-3 text-neutral-700">
          <span className="font-semibold">Filters:</span> {filters.join(" · ")}
        </p>
      )}
      {children}
    </div>
  );
}

export type PrintColumn<T> = {
  header: string;
  cell: (row: T, index: number) => React.ReactNode;
  align?: "right";
  className?: string;
};

/** Plain bordered table for print views. */
export function PrintTable<T>({
  columns,
  rows,
  rowKey,
  footer,
}: {
  columns: PrintColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  footer?: React.ReactNode;
}) {
  if (rows.length === 0) return <p className="text-neutral-600">No records match.</p>;
  return (
    <table className="w-full">
      <thead>
        <tr className="bg-neutral-100">
          {columns.map((column) => (
            <th
              key={column.header}
              className={`px-2 py-1.5 text-left font-semibold ${column.align === "right" ? "text-right" : ""} ${column.className ?? ""}`}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={rowKey(row)}>
            {columns.map((column) => (
              <td
                key={column.header}
                className={`px-2 py-1 align-top ${column.align === "right" ? "text-right tabular-nums" : ""} ${column.className ?? ""}`}
              >
                {column.cell(row, index)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer && <tfoot>{footer}</tfoot>}
    </table>
  );
}

/** "Showing first N" note when a print view hit its row limit. */
export function truncationNote(shown: number, total: number) {
  return total > shown ? `${shown} of ${total} records (first ${shown} shown)` : `${total} record${total === 1 ? "" : "s"}`;
}
