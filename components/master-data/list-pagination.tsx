import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { ListParams, Paginated } from "@/lib/data/list-params";
import { cn } from "@/lib/utils";

const numberFormat = new Intl.NumberFormat("en");

type ListPaginationProps = {
  href: string;
  params: ListParams;
  result: Paginated<unknown>;
};

function pageHref(href: string, query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${href}?${search}` : href;
}

export function ListPagination({ href, params, result }: ListPaginationProps) {
  const { page, pageCount, pageSize, total, items } = result;
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = (page - 1) * pageSize + items.length;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row">
      <p>
        Showing {numberFormat.format(first)}–{numberFormat.format(last)} of{" "}
        {numberFormat.format(total)}
      </p>
      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-2">
          <PageLink
            href={pageHref(href, params.query, page - 1)}
            disabled={page <= 1}
            label="Previous page"
          >
            <ChevronLeft />
            Previous
          </PageLink>
          <span className="tabular-nums">
            Page {page} of {pageCount}
          </span>
          <PageLink
            href={pageHref(href, params.query, page + 1)}
            disabled={page >= pageCount}
            label="Next page"
          >
            Next
            <ChevronRight />
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className = cn(buttonVariants({ variant: "outline", size: "sm" }));
  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={cn(className, "pointer-events-none opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
