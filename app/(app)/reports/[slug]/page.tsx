import { ArrowLeft, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { loadReport } from "@/components/reports/load-report";
import { buttonVariants } from "@/components/ui/button";
import { REPORTS, type ReportSlug } from "@/lib/report-registry";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Report" };

export default async function Page({ params, searchParams }: PageProps<"/reports/[slug]">) {
  const context = await requirePermission("reports:view");
  const { slug } = await params;
  const report = REPORTS.find((entry) => entry.slug === slug);
  if (!report) notFound();
  const loaded = await loadReport(report.slug as ReportSlug, await searchParams, context);
  const printHref = `/print/reports/${report.slug}${loaded.query ? `?${loaded.query}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/reports" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 w-fit" })}>
        <ArrowLeft />
        All reports
      </Link>
      <PageHeader
        title={report.title}
        description={report.description}
        actions={
          <Link href={printHref} target="_blank" rel="noopener" className={buttonVariants({ variant: "outline" })}>
            <Printer />
            Print report
          </Link>
        }
      />
      {loaded.filters}
      {loaded.body}
    </div>
  );
}
