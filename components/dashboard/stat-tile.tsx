import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import type { Tile } from "@/lib/data/dashboard";

/**
 * Stat tile: label · value · delta vs last month · 6-month sparkline.
 * The delta is neutral ink (up isn't automatically good or bad here); the
 * sparkline is de-emphasis grey with the current month as an accent dot.
 */
export function StatTile({ tile }: { tile: Tile }) {
  const DeltaIcon = tile.delta?.direction === "up" ? ArrowUpRight : tile.delta?.direction === "down" ? ArrowDownRight : ArrowRight;
  return (
    <Link href={tile.href} className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Card className="h-full gap-3 transition-colors group-hover:bg-muted/40">
        <CardContent className="flex h-full flex-col gap-3">
          <p className="text-sm text-muted-foreground">{tile.label}</p>
          <div className="flex items-end justify-between gap-3">
            <p className="text-3xl leading-none font-semibold tracking-tight">{tile.value}</p>
            {tile.trend && <Sparkline values={tile.trend.values} labels={tile.trend.labels} name={tile.label} />}
          </div>
          <div className="mt-auto flex flex-col gap-0.5 text-xs text-muted-foreground">
            {tile.delta && (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <DeltaIcon className="size-3.5" aria-hidden="true" />
                {tile.delta.text}
              </span>
            )}
            <span className="truncate">{tile.hint}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function Sparkline({ values, labels, name }: { values: number[]; labels: string[]; name: string }) {
  const width = 88;
  const height = 32;
  const pad = 5;
  const max = Math.max(...values, 1);
  const step = (width - pad * 2) / Math.max(values.length - 1, 1);
  const points = values.map((value, i) => [pad + i * step, height - pad - (value / max) * (height - pad * 2)] as const);
  const [lastX, lastY] = points.at(-1)!;
  const summary = values.map((value, i) => `${labels[i]} ${value.toLocaleString("en")}`).join(", ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${name}, last 6 months: ${summary}`} className="shrink-0 overflow-visible">
      <title>{`Last 6 months: ${summary}`}</title>
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="var(--viz-muted)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Current month: accent dot with a 2px surface ring. */}
      <circle cx={lastX} cy={lastY} r={4} fill="var(--viz-accent)" stroke="var(--card)" strokeWidth={2} />
    </svg>
  );
}
