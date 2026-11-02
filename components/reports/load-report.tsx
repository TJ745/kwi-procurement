import "server-only";

import {
  MrsAwaitingPoView,
  PaymentsSummaryView,
  PendingDeliveriesView,
  ProjectMaterialsView,
  SpendView,
  SupplierStatementView,
} from "@/components/reports/report-views";
import { ReportFilters } from "@/components/reports/report-filters";
import type { SearchParams } from "@/lib/data/list-params";
import type { ReportSlug } from "@/lib/report-registry";
import {
  mrsAwaitingPo,
  parseDateRange,
  paymentsSummary,
  pendingDeliveries,
  pickId,
  projectMaterials,
  reportFilterOptions,
  spendSummary,
  supplierStatement,
} from "@/lib/reports";
import type { AuthContext } from "@/lib/session";

type Loaded = {
  /** Filter form (app page only). */
  filters: React.ReactNode;
  /** Human-readable filters for the print header. */
  filterLabels: string[];
  body: React.ReactNode;
  /** Query string carrying the current filters (for the print link). */
  query: string;
};

/** Parses a report's filters, loads its data and builds its view. */
export async function loadReport(
  slug: ReportSlug,
  searchParams: SearchParams,
  context: AuthContext,
  print = false,
): Promise<Loaded> {
  const { formatDate, settings } = context;
  const range = parseDateRange(searchParams, settings);
  const rangeLabel = `${formatDate.calendarDate(new Date(`${range.from}T00:00:00Z`))} – ${formatDate.calendarDate(new Date(`${range.to}T00:00:00Z`))}`;
  const supplierId = pickId(searchParams.supplier);
  const projectId = pickId(searchParams.project);
  const query = (values: Record<string, string | undefined>) =>
    new URLSearchParams(Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString();
  const common = { formatDate, print };

  switch (slug) {
    case "supplier-statement": {
      const options = await reportFilterOptions();
      const data = supplierId ? await supplierStatement(supplierId, range) : null;
      return {
        filters: <ReportFilters range={range} supplier={{ options: options.suppliers, value: supplierId, required: true }} />,
        filterLabels: [data ? `Supplier: ${data.supplier.name}` : "", `Period: ${rangeLabel}`].filter(Boolean),
        body: data ? (
          <SupplierStatementView data={data} {...common} />
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Select a supplier to see its statement of account.
          </p>
        ),
        query: query({ supplier: supplierId, from: range.from, to: range.to }),
      };
    }
    case "project-materials": {
      const options = await reportFilterOptions();
      const data = await projectMaterials(range, projectId);
      const project = options.projects.find((p) => p.value === projectId);
      return {
        filters: <ReportFilters range={range} project={{ options: options.projects, value: projectId }} />,
        filterLabels: [project ? `Project: ${project.label}` : "All projects", `Period: ${rangeLabel}`],
        body: <ProjectMaterialsView data={data} {...common} />,
        query: query({ project: projectId, from: range.from, to: range.to }),
      };
    }
    case "pending-deliveries": {
      const options = await reportFilterOptions();
      const data = await pendingDeliveries({ supplierId, projectId });
      const supplier = options.suppliers.find((s) => s.value === supplierId);
      const project = options.projects.find((p) => p.value === projectId);
      return {
        filters: (
          <ReportFilters supplier={{ options: options.suppliers, value: supplierId }} project={{ options: options.projects, value: projectId }} />
        ),
        filterLabels: [supplier ? `Supplier: ${supplier.label}` : "All suppliers", project ? `Project: ${project.label}` : "All projects"],
        body: <PendingDeliveriesView data={data} {...common} />,
        query: query({ supplier: supplierId, project: projectId }),
      };
    }
    case "payments-summary": {
      const data = await paymentsSummary(range);
      return {
        filters: <ReportFilters range={range} />,
        filterLabels: [`Period: ${rangeLabel}`],
        body: <PaymentsSummaryView data={data} {...common} />,
        query: query({ from: range.from, to: range.to }),
      };
    }
    case "spend": {
      const data = await spendSummary(range);
      return {
        filters: <ReportFilters range={range} />,
        filterLabels: [`Period: ${rangeLabel}`],
        body: <SpendView data={data} {...common} />,
        query: query({ from: range.from, to: range.to }),
      };
    }
    case "mrs-awaiting-po": {
      const data = await mrsAwaitingPo(settings);
      return { filters: null, filterLabels: [], body: <MrsAwaitingPoView data={data} {...common} />, query: "" };
    }
  }
}
