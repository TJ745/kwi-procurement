import { Suspense } from "react";

import {
  MasterDataStats,
  MasterDataStatsSkeleton,
} from "@/components/dashboard/master-data-stats";
import { ModuleList } from "@/components/dashboard/module-list";
import { PageHeader } from "@/components/page-header";
import { DASHBOARD, MASTER_DATA, WORKFLOWS } from "@/lib/navigation";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const { user } = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome, ${user.name}`}
        description={DASHBOARD.description}
      />

      <section aria-labelledby="master-data-summary" className="flex flex-col gap-3">
        <h2 id="master-data-summary" className="sr-only">
          Master data summary
        </h2>
        <Suspense fallback={<MasterDataStatsSkeleton />}>
          <MasterDataStats />
        </Suspense>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ModuleList
          title="Master data"
          description="Reference data used across procurement workflows."
          items={MASTER_DATA}
        />
        <ModuleList
          title="Procurement modules"
          description="These workflows will be configured in upcoming phases."
          items={WORKFLOWS}
          badge="Planned"
        />
      </div>
    </div>
  );
}
