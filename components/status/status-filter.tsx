"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

/** Keeps the selected value in the URL (default `?status=`) and resets paging. */
export function StatusFilter({
  statuses,
  labels,
  param = "status",
  allLabel = "All statuses",
}: {
  statuses: readonly string[];
  labels: Record<string, string>;
  /** Query parameter name, e.g. "term" for supplier payment terms. */
  param?: string;
  allLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(param, value);
    else params.delete(param);
    params.delete("page");
    const search = params.toString();
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }));
  }

  return (
    <NativeSelect
      aria-label={allLabel.replace(/^All /, "Filter by ")}
      defaultValue={searchParams.get(param) ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="w-full sm:w-44"
    >
      <NativeSelectOption value="">{allLabel}</NativeSelectOption>
      {statuses.map((status) => (
        <NativeSelectOption key={status} value={status}>
          {labels[status]}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
