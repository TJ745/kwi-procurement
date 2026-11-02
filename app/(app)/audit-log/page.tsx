import type { Metadata } from "next";

import { AuditEntries } from "@/components/audit/audit-entries";
import { MasterDataList } from "@/components/master-data/master-data-list";
import { PageHeader } from "@/components/page-header";
import { StatusFilter } from "@/components/status/status-filter";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, AUDIT_PERIODS } from "@/lib/audit-labels";
import { listAuditLog, parseAuditFilters } from "@/lib/data/audit-log";
import { parseListParams } from "@/lib/data/list-params";
import { getNavItem } from "@/lib/navigation";
import { requireSuperAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Audit log" };

const PERIOD_LABELS = Object.fromEntries(Object.entries(AUDIT_PERIODS).map(([key, value]) => [key, value.label]));

export default async function Page({ searchParams }: PageProps<"/audit-log">) {
  const { formatDate } = await requireSuperAdmin();
  const raw = await searchParams;
  const params = parseListParams(raw);
  const filters = parseAuditFilters(raw);
  const result = await listAuditLog(params, filters);
  const item = getNavItem("/audit-log");
  const active = Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) as Record<string, string>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description="Every change, administration action and sign-in. Entries are permanent and can't be edited or deleted."
      />
      <MasterDataList
        item={item}
        noun="audit entries"
        params={params}
        result={result}
        canCreate={false}
        createLabel=""
        searchPlaceholder="Search who, record, summary or IP"
        filters={active}
        toolbar={
          <>
            <StatusFilter statuses={Object.keys(AUDIT_ENTITY_LABELS)} labels={AUDIT_ENTITY_LABELS} param="entity" allLabel="All records" />
            <StatusFilter statuses={Object.keys(AUDIT_ACTION_LABELS)} labels={AUDIT_ACTION_LABELS} param="action" allLabel="All actions" />
            <StatusFilter statuses={Object.keys(AUDIT_PERIODS)} labels={PERIOD_LABELS} param="period" allLabel="All time" />
          </>
        }
      >
        <div className="overflow-x-auto">
          <AuditEntries items={result.items} formatDate={formatDate} />
        </div>
      </MasterDataList>
    </div>
  );
}
