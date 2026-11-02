import { TZDate } from "@date-fns/tz";
import { ClipboardList, PackageCheck, ShoppingCart, Wallet } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import {
  ActivityCard,
  AttentionCard,
  CardSkeleton,
  KpiRow,
  KpiRowSkeleton,
  MasterDataStrip,
  PaymentStatusCard,
  PipelineCard,
  SpendCard,
  TopProjectsCard,
} from "@/components/dashboard/widgets";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/session";

/**
 * Dashboard: every panel loads in its own Suspense boundary (a slow query
 * never blocks the rest) and only appears for modules the user can view.
 */
export default async function DashboardPage() {
  const { user, can, formatDate, settings } = await requireUser();
  const hour = new TZDate(new Date(), settings.timeZone).getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const actions = [
    can("material_requests:create") && { href: "/material-requests/new", label: "New MR", icon: ClipboardList },
    can("purchase_orders:create") && { href: "/purchase-orders/new", label: "New PO", icon: ShoppingCart },
    can("payment_requests:create") && { href: "/payment-requests/new", label: "New payment request", icon: Wallet },
    can("grns:create") && { href: "/grn/new", label: "New GRN", icon: PackageCheck },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Wallet }[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{formatDate.date(new Date())}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {user.name}
          </h1>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={buttonVariants({ variant: index === 0 ? "default" : "outline" })}
              >
                <action.icon />
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Suspense fallback={<KpiRowSkeleton />}>
        <KpiRow />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Suspense fallback={<CardSkeleton height="h-80" />}>
            <SpendCard />
          </Suspense>
          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<CardSkeleton />}>
              <TopProjectsCard />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
              <PaymentStatusCard />
            </Suspense>
          </div>
          <Suspense fallback={<CardSkeleton height="h-36" />}>
            <PipelineCard />
          </Suspense>
        </div>
        <div className="flex flex-col gap-4">
          <Suspense fallback={<CardSkeleton height="h-72" />}>
            <AttentionCard />
          </Suspense>
          <Suspense fallback={<CardSkeleton height="h-96" />}>
            <ActivityCard />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<CardSkeleton height="h-16" />}>
        <MasterDataStrip />
      </Suspense>
    </div>
  );
}
