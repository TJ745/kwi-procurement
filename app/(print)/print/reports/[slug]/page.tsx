import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintDocument } from "@/components/print/print-document";
import { loadReport } from "@/components/reports/load-report";
import { REPORTS, type ReportSlug } from "@/lib/report-registry";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Print · Report" };

export default async function Page({ params, searchParams }: PageProps<"/print/reports/[slug]">) {
  const context = await requirePermission("reports:view");
  const { slug } = await params;
  const report = REPORTS.find((entry) => entry.slug === slug);
  if (!report) notFound();
  const loaded = await loadReport(report.slug as ReportSlug, await searchParams, context, true);

  return (
    <PrintDocument
      title={report.title}
      filters={loaded.filterLabels}
      settings={context.settings}
      generatedAt={context.formatDate.dateTime(new Date())}
    >
      {loaded.body}
    </PrintDocument>
  );
}
