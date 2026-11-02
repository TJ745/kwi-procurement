import { Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Option = { value: string; label: string };

type ReportFiltersProps = {
  /** Date range inputs (from/to). */
  range?: { from: string; to: string };
  supplier?: { options: Option[]; value?: string; required?: boolean };
  project?: { options: Option[]; value?: string };
};

/** Plain GET form: filters live in the URL, so reports can be bookmarked and printed. */
export function ReportFilters({ range, supplier, project }: ReportFiltersProps) {
  return (
    <Card size="sm">
      <CardContent>
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {supplier && (
            <label className="flex min-w-56 flex-1 flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Supplier</span>
              <NativeSelect name="supplier" defaultValue={supplier.value ?? ""} required={supplier.required} className="w-full">
                <NativeSelectOption value="">{supplier.required ? "Select a supplier" : "All suppliers"}</NativeSelectOption>
                {supplier.options.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          )}
          {project && (
            <label className="flex min-w-56 flex-1 flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Project</span>
              <NativeSelect name="project" defaultValue={project.value ?? ""} className="w-full">
                <NativeSelectOption value="">All projects</NativeSelectOption>
                {project.options.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          )}
          {range && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">From</span>
                <Input type="date" name="from" defaultValue={range.from} required />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">To</span>
                <Input type="date" name="to" defaultValue={range.to} required />
              </label>
            </>
          )}
          <Button type="submit">
            <Filter />
            Apply
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
