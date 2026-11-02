import Link from "next/link";

type Row = { key?: string; label: string; value: number; display: string; href?: string };

/**
 * Ranked horizontal bars, one hue: 8px marks with a 4px rounded data-end,
 * square at the baseline; value printed at the tip. Names and values are
 * text (never the bar colour), so the list doubles as its own table view.
 */
export function BarList({ rows, emptyText }: { rows: Row[]; emptyText: string }) {
  const max = Math.max(...rows.map((row) => row.value), 0);
  if (rows.length === 0 || max === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const width = `${Math.max((row.value / max) * 100, row.value > 0 ? 2 : 0)}%`;
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{row.label}</span>
              <span className="shrink-0 font-medium tabular-nums">{row.display}</span>
            </div>
            <div className="h-2 w-full" aria-hidden="true">
              <div className="h-full rounded-r-[4px] bg-viz-accent transition-[width]" style={{ width }} />
            </div>
          </>
        );
        return (
          <li key={row.key ?? row.label} title={`${row.label}: ${row.display}`}>
            {row.href ? (
              <Link href={row.href} className="flex flex-col gap-1.5 rounded-md outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50">
                {content}
              </Link>
            ) : (
              <div className="flex flex-col gap-1.5">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
