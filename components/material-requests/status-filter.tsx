"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  MATERIAL_REQUEST_STATUSES,
  MATERIAL_REQUEST_STATUS_LABELS,
} from "@/lib/validation/material-request";

/** Keeps the selected status in the URL (`?status=`) and resets paging. */
export function StatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("status", value);
    else params.delete("status");
    params.delete("page");
    const search = params.toString();
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }));
  }

  return (
    <NativeSelect
      aria-label="Filter by status"
      defaultValue={searchParams.get("status") ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="w-full sm:w-44"
    >
      <NativeSelectOption value="">All statuses</NativeSelectOption>
      {MATERIAL_REQUEST_STATUSES.map((status) => (
        <NativeSelectOption key={status} value={status}>
          {MATERIAL_REQUEST_STATUS_LABELS[status]}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
