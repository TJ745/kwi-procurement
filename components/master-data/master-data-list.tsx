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
  children,
}: MasterDataListProps) {
  const isEmpty = result.total === 0;

  if (isEmpty && !params.query) {
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
      <div className="border-b p-4">
        <SearchInput placeholder={searchPlaceholder} />
      </div>
      {isEmpty ? (
        <div className="p-4">
          <EmptyState
            icon={SearchX}
            title={`No ${noun} found`}
            description={`Nothing matches “${params.query}”. Try a different search.`}
          />
        </div>
      ) : (
        children
      )}
      <ListPagination href={item.href} params={params} result={result} />
    </Card>
  );
}
