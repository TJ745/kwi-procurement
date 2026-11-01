import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMasterDataCounts } from "@/lib/data/dashboard";
import { MASTER_DATA } from "@/lib/navigation";

const numberFormat = new Intl.NumberFormat("en");

export async function MasterDataStats() {
  const counts = await getMasterDataCounts();
  const visible = MASTER_DATA.filter((item) => counts.has(item.href));
  if (visible.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {visible.map((item) => {
        const count = counts.get(item.href) ?? 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total {item.title}
                </CardTitle>
                <item.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tabular-nums">
                  {numberFormat.format(count)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {count === 0
                    ? "No records yet"
                    : count === 1
                      ? "1 record"
                      : `${numberFormat.format(count)} records`}
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export function MasterDataStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
      {MASTER_DATA.map((item) => (
        <Skeleton key={item.href} className="h-30 rounded-xl" />
      ))}
    </div>
  );
}
