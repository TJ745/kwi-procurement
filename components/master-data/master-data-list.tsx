import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ListPagination } from "@/components/master-data/list-pagination";
import { SearchInput } from "@/components/master-data/search-input";
import { Card } from "@/components/ui/card";
import type { ListParams, Paginated } from "@/lib/data/list-params";
import type { NavItem } from "@/lib/navigation";

type MasterDataListProps = {
  item: NavItem;
  /** Plural, lowercase noun, e.g. "projects". */
  noun: string;
  params: ListParams;
  result: Paginated<unknown>;
  canCreate: boolean;
  createLabel: string;
  searchPlaceholder: string;
  /** Extra toolbar controls, e.g. filters. */
  toolbar?: React.ReactNode;
  /** Filters beyond the search box that are active (affects the empty state). */
  filters?: Record<string, string>;
  children: React.ReactNode;
};

/** Search toolbar, table container, empty states and pagination. */
export function MasterDataList({
  item,
  noun,
  params,
  result,
  canCreate,
  createLabel,
  searchPlaceholder,
  toolbar,
  filters = {},
  children,
}: MasterDataListProps) {
  const isEmpty = result.total === 0;
  const isFiltered = Boolean(params.query) || Object.keys(filters).length > 0;

  if (isEmpty && !isFiltered) {
    return (
      <EmptyState
        icon={item.icon}
        title={`No ${noun} yet`}
        description={
          canCreate
            ? `Use “${createLabel}” to add the first one.`
            : `${item.title} will appear here once they are added by an administrator.`
        }
      />
    );
  }

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
        <SearchInput placeholder={searchPlaceholder} />
        {toolbar}
      </div>
      {isEmpty ? (
        <div className="p-4">
          <EmptyState
            icon={SearchX}
            title={`No ${noun} found`}
            description={
              params.query
                ? `Nothing matches “${params.query}”. Try a different search or filter.`
                : "Nothing matches the selected filter."
            }
          />
        </div>
      ) : (
        children
      )}
      <ListPagination href={item.href} params={params} result={result} extraParams={filters} />
    </Card>
  );
}
