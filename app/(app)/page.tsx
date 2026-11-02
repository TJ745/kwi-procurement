import { ShieldQuestion } from "lucide-react";
import { Suspense } from "react";

import {
  MasterDataStats,
  MasterDataStatsSkeleton,
} from "@/components/dashboard/master-data-stats";
import { ModuleList } from "@/components/dashboard/module-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { DASHBOARD, MASTER_DATA, WORKFLOWS } from "@/lib/navigation";
import { NAV_PERMISSIONS } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const { user, can } = await requireUser();
  const visible = (item: { href: string }) => {
    const permission = NAV_PERMISSIONS[item.href];
    return !permission || can(permission);
  };
  const masterData = MASTER_DATA.filter(visible);
  const workflows = WORKFLOWS.filter(visible);
  // Workflows without a permission entry have not been built yet.
  const planned = Object.fromEntries(
    WORKFLOWS.filter((item) => !NAV_PERMISSIONS[item.href]).map((item) => [item.href, "Planned"]),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome, ${user.name}`}
        description={DASHBOARD.description}
      />

      {masterData.length > 0 ? (
        <section aria-labelledby="master-data-summary" className="flex flex-col gap-3">
          <h2 id="master-data-summary" className="sr-only">
            Master data summary
          </h2>
          <Suspense fallback={<MasterDataStatsSkeleton />}>
            <MasterDataStats />
          </Suspense>
        </section>
      ) : (
        <EmptyState
          icon={ShieldQuestion}
          title="No modules assigned yet"
          description="Your role does not include access to any master-data modules. Contact your administrator if you need access."
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {masterData.length > 0 && (
          <ModuleList
            title="Master data"
            description="Reference data used across procurement workflows."
            items={masterData}
          />
        )}
        <ModuleList
          title="Procurement modules"
          description="Procurement workflows. Items marked Planned arrive in later phases."
          items={workflows}
          badges={planned}
        />
      </div>
    </div>
  );
}
