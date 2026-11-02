import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Colours per workflow status (shared by material requests and POs). */
const STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED:
    "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900",
  APPROVED:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900",
  REJECTED:
    "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900",
  ISSUED:
    "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900",
  CLOSED:
    "bg-stone-200 text-stone-700 ring-1 ring-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", STYLES[status])}>
      {label}
    </Badge>
  );
}
