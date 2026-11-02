import { formatDistanceToNow } from "date-fns";
import { CircleCheck, Clock, Hourglass, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { BarList } from "@/components/dashboard/bar-list";
import { SpendChart } from "@/components/dashboard/spend-chart";
import { StatTile } from "@/components/dashboard/stat-tile";
import { StatusBadge } from "@/components/status/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AttentionItem,
  getAttention,
  getKpiTiles,
  getMasterDataCounts,
  getPaymentStatus,
  getPipeline,
  getRecentActivity,
  getSpendByMonth,
  getTopProjects,
} from "@/lib/data/dashboard";
import { formatMoney } from "@/lib/money";
import { MASTER_DATA } from "@/lib/navigation";

const number = new Intl.NumberFormat("en");

// --- KPI row -------------------------------------------------------------------

export async function KpiRow() {
  const tiles = await getKpiTiles();
  if (tiles.length === 0) return null;
  return (
    <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {tiles.map((tile) => (
        <StatTile key={tile.key} tile={tile} />
      ))}
    </section>
  );
}

export function KpiRowSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5" aria-busy="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}

// --- Spend per month -----------------------------------------------------------

export async function SpendCard() {
  const data = await getSpendByMonth();
  if (!data) return null;
  const total = data.points.reduce((sum, p) => sum + p.value, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend per month</CardTitle>
        <CardDescription>
          Approved, issued & closed purchase orders · last 12 months · {data.currency}
          {data.excluded > 0 && ` · ${data.excluded} in other currencies not shown`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No approved purchase orders in the last 12 months yet.</p>
        ) : (
          <>
            <SpendChart points={data.points} currency={data.currency} />
            {/* Table view of the same figures for screen readers. */}
            <table className="sr-only">
              <caption>Spend per month in {data.currency}</caption>
              <tbody>
                {data.points.map((p) => (
                  <tr key={p.key}>
                    <th scope="row">{p.long}</th>
                    <td>{formatMoney(p.display, data.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// --- Top projects / payment status / pipeline -----------------------------------------

export async function TopProjectsCard() {
  const data = await getTopProjects();
  if (!data) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top projects by spend</CardTitle>
        <CardDescription>Last 12 months · {data.currency}</CardDescription>
      </CardHeader>
      <CardContent>
        <BarList
          rows={data.rows.map((row) => ({ ...row, display: formatMoney(row.display, data.currency, false) }))}
          emptyText="No project spend yet."
        />
      </CardContent>
    </Card>
  );
}

export async function PaymentStatusCard() {
  const data = await getPaymentStatus();
  if (!data) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment requests by status</CardTitle>
        <CardDescription>All payment requests</CardDescription>
      </CardHeader>
      <CardContent>
        <BarList rows={data.map((row) => ({ ...row, display: number.format(row.value) }))} emptyText="No payment requests yet." />
      </CardContent>
    </Card>
  );
}

export async function PipelineCard() {
  const steps = await getPipeline();
  if (steps.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Procurement pipeline</CardTitle>
        <CardDescription>Documents in the last 12 months, from request to payment</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.key}>
              <Link
                href={step.href}
                className="flex h-full flex-col gap-1 rounded-lg border p-3 outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-foreground">
                    {index + 1}
                  </span>
                  {step.label}
                </span>
                <span className="text-2xl font-semibold">{number.format(step.value)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

// --- Needs attention / recent activity -------------------------------------------------

const ATTENTION_ICON: Record<AttentionItem["kind"], { icon: typeof Clock; label: string; className: string }> = {
  urgent: { icon: TriangleAlert, label: "Urgent", className: "text-destructive" },
  approval: { icon: Clock, label: "Awaiting approval", className: "text-muted-foreground" },
  stale: { icon: Hourglass, label: "Waiting", className: "text-muted-foreground" },
};

export async function AttentionCard() {
  const items = await getAttention();
  const shown = items.slice(0, 8);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>
          {items.length === 0 ? "You're all caught up." : `${items.length} item${items.length === 1 ? "" : "s"} waiting for action`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <CircleCheck className="size-6" aria-hidden="true" />
            Nothing needs your attention right now.
          </div>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {shown.map((item) => {
              const meta = ATTENTION_ICON[item.kind];
              return (
                <li key={item.key}>
                  <Link href={item.href} className="flex gap-3 rounded-lg px-2 py-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
                    <meta.icon className={`mt-0.5 size-4 shrink-0 ${meta.className}`} aria-label={meta.label} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{item.title}</span>
                      <span className="truncate text-xs text-muted-foreground">{item.detail}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export async function ActivityCard() {
  const items = await getRecentActivity();
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">No documents yet.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest created or updated documents</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="-mx-2 flex flex-col">
          {items.map((item) => (
            <li key={item.key}>
              <Link href={item.href} className="flex items-center gap-3 rounded-lg px-2 py-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-mono text-sm font-medium">{item.number}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {item.type} · {item.created ? "created" : "updated"} {formatDistanceToNow(item.at, { addSuffix: true })}
                  </span>
                </span>
                <StatusBadge status={item.statusKey} label={item.status} />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// --- Master data strip --------------------------------------------------------------------

export async function MasterDataStrip() {
  const counts = await getMasterDataCounts();
  const items = MASTER_DATA.filter((item) => counts.has(item.href));
  if (items.length === 0) return null;
  return (
    <section aria-label="Master data" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <item.icon className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg leading-tight font-semibold">{number.format(counts.get(item.href) ?? 0)}</span>
            <span className="text-xs text-muted-foreground">{item.title}</span>
          </div>
        </Link>
      ))}
    </section>
  );
}

// --- Skeleton ----------------------------------------------------------------------------------

export function CardSkeleton({ height = "h-64" }: { height?: string }) {
  return <Skeleton className={`${height} rounded-xl`} aria-busy="true" />;
}
