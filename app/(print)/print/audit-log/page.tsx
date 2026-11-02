import type { Metadata } from "next";

import { AuditEntries } from "@/components/audit/audit-entries";
import { PrintDocument, truncationNote } from "@/components/print/print-document";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, AUDIT_PERIODS } from "@/lib/audit-labels";
import { listAuditLog, parseAuditFilters } from "@/lib/data/audit-log";
import { parseListParams, printParams } from "@/lib/data/list-params";
import { describeFilters } from "@/lib/print";
import { requireSuperAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Print · Audit log" };

export default async function Page({ searchParams }: PageProps<"/print/audit-log">) {
  const { settings, formatDate } = await requireSuperAdmin();
  const raw = await searchParams;
  const params = parseListParams(raw);
  const filters = parseAuditFilters(raw);
  const result = await listAuditLog(printParams(params), filters);
  return (
    <PrintDocument
      title="Audit log"
      filters={describeFilters(params, [
        filters.entity && `Record: ${AUDIT_ENTITY_LABELS[filters.entity]}`,
        filters.action && `Action: ${AUDIT_ACTION_LABELS[filters.action]}`,
        filters.period && AUDIT_PERIODS[filters.period].label,
      ])}
      summary={truncationNote(result.items.length, result.total)}
      settings={settings}
      generatedAt={formatDate.dateTime(new Date())}
    >
      <AuditEntries items={result.items} formatDate={formatDate} print />
    </PrintDocument>
  );
}
