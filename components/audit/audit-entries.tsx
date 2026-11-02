import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, auditRecordHref } from "@/lib/audit-labels";
import type { listAuditLog } from "@/lib/data/audit-log";
import type { DateFormatter } from "@/lib/format";

type Entry = Awaited<ReturnType<typeof listAuditLog>>["items"][number];

const ACTION_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  delete: "destructive",
  sign_in_failed: "destructive",
  deactivate: "destructive",
  create: "default",
};

/** Audit entries as a table; expandable field changes (always open when printed). */
export function AuditEntries({ items, formatDate, print }: { items: Entry[]; formatDate: DateFormatter; print?: boolean }) {
  return (
    <table className="report-table min-w-[56rem]">
      <thead>
        <tr>
          <th className="w-40">When</th>
          <th className="w-52">Who</th>
          <th className="w-32">Action</th>
          <th className="w-56">Record</th>
          <th>Details</th>
          <th className="w-28">IP address</th>
        </tr>
      </thead>
      <tbody>
        {items.map((entry) => {
          const href = entry.action !== "delete" ? auditRecordHref(entry.entityType, entry.entityId, entry.entityLabel) : null;
          return (
            <tr key={entry.id}>
              <td className="whitespace-nowrap tabular-nums">{formatDate.dateTime(entry.createdAt)}</td>
              <td>
                <div className="flex flex-col">
                  <span className="font-medium">{entry.actorName ?? "Unknown"}</span>
                  {entry.actorEmail && <span className="text-xs text-muted-foreground print:text-neutral-600">{entry.actorEmail}</span>}
                </div>
              </td>
              <td>
                {print ? (
                  AUDIT_ACTION_LABELS[entry.action] ?? entry.action
                ) : (
                  <Badge variant={ACTION_VARIANT[entry.action] ?? "secondary"}>{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</Badge>
                )}
              </td>
              <td>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground print:text-neutral-600">
                    {AUDIT_ENTITY_LABELS[entry.entityType] ?? entry.entityType}
                  </span>
                  {entry.entityLabel &&
                    (href && !print ? (
                      <Link href={href} className="font-mono text-sm underline-offset-4 hover:underline">
                        {entry.entityLabel}
                      </Link>
                    ) : (
                      <span className="font-mono text-sm">{entry.entityLabel}</span>
                    ))}
                </div>
              </td>
              <td>
                <p>{entry.summary}</p>
                {(entry.changes.length > 0 || entry.userAgent) && (
                  <details open={print} className="mt-1 text-xs">
                    <summary className="cursor-pointer text-muted-foreground select-none print:hidden">
                      {entry.changes.length > 0 ? `${entry.changes.length} field${entry.changes.length === 1 ? "" : "s"} changed` : "Details"}
                    </summary>
                    {entry.changes.length > 0 && (
                      <dl className="mt-1.5 grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-3 gap-y-1">
                        {entry.changes.map((change) => (
                          <div key={change.field} className="contents">
                            <dt className="font-medium">{change.label}</dt>
                            <dd className="wrap-break-word">
                              <span className="text-muted-foreground line-through decoration-1 print:text-neutral-600">{change.from ?? "—"}</span>
                              <span aria-hidden="true"> → </span>
                              <span className="sr-only"> changed to </span>
                              <span>{change.to ?? "—"}</span>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {entry.userAgent && <p className="mt-1.5 break-all text-muted-foreground print:text-neutral-600">{entry.userAgent}</p>}
                  </details>
                )}
              </td>
              <td className="font-mono text-xs">{entry.ipAddress ?? "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
