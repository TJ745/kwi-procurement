import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MATERIAL_REQUEST_STATUS_LABELS,
  type MaterialRequestStatusValue,
} from "@/lib/validation/material-request";

const STYLES: Record<MaterialRequestStatusValue, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED:
    "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900",
  APPROVED:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900",
  REJECTED:
    "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900",
};

export function StatusBadge({ status }: { status: MaterialRequestStatusValue }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", STYLES[status])}>
      {MATERIAL_REQUEST_STATUS_LABELS[status]}
    </Badge>
  );
}
