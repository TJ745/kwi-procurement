"use client";

import { Loader2, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

import { Input } from "@/components/ui/input";

/** Search box that keeps the query in the URL (`?q=`) and resets paging. */
export function SearchInput({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  function onChange(value: string) {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      const query = value.trim();
      if (query) params.set("q", query);
      else params.delete("q");
      params.delete("page");
      const search = params.toString();
      startTransition(() => {
        router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
      });
    }, 300);
  }

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pr-8 pl-8"
      />
      {isPending && (
        <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
