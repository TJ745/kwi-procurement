"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { key: string; label: string; long: string; value: number; display: string };

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

/**
 * Single-series column chart (no legend: the card title names it). Columns
 * are capped at 24px with a 4px rounded top, square at the baseline; one
 * recessive hairline grid; hover tooltip per month.
 */
export function SpendChart({ points, currency }: { points: Point[]; currency: string }) {
  const max = Math.max(...points.map((p) => p.value), 0);
  const tick = (value: number) => (max >= 10_000 ? compact.format(value) : full.format(value));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            tickFormatter={tick}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={({ active, payload }) => {
              const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
              if (!point) return null;
              return (
                <div className="rounded-lg bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
                  <p className="text-xs text-muted-foreground">{point.long}</p>
                  <p className="font-medium tabular-nums">
                    {full.format(point.value)} {currency}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" fill="var(--viz-accent)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
