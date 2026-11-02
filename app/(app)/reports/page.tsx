import { ChevronRight, FileBarChart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNavItem } from "@/lib/navigation";
import { REPORTS } from "@/lib/report-registry";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Reports" };

export default async function Page() {
  await requirePermission("reports:view");
  const item = getNavItem("/reports");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={item.title} description="Choose a report. Every report can be filtered and printed." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => (
          <Link
            key={report.slug}
            href={`/reports/${report.slug}`}
            className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                    <FileBarChart className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
