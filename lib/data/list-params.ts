export const PAGE_SIZE = 20;
/** Upper bound for print views, which list every matching row. */
export const PRINT_LIMIT = 5000;

export type ListParams = { query: string; page: number; pageSize?: number };

export type SearchParams = Record<string, string | string[] | undefined>;

/** Reads `?q=` and `?page=` defensively; invalid values fall back to defaults. */
export function parseListParams(searchParams: SearchParams): ListParams {
  const q = searchParams.q;
  const page = Number(typeof searchParams.page === "string" ? searchParams.page : 1);
  return {
    query: typeof q === "string" ? q.trim().slice(0, 100) : "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
};

/** Counts first so an out-of-range page clamps to the last page. */
export async function paginate<T>(
  paging: number | { page: number; pageSize?: number },
  count: () => Promise<number>,
  find: (args: { skip: number; take: number }) => Promise<T[]>,
): Promise<Paginated<T>> {
  const page = typeof paging === "number" ? paging : paging.page;
  const pageSize = (typeof paging === "number" ? undefined : paging.pageSize) ?? PAGE_SIZE;
  const total = await count();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const items =
    total === 0
      ? []
      : await find({ skip: (current - 1) * pageSize, take: pageSize });
  return { items, total, page: current, pageCount, pageSize };
}

/** List parameters for a print view: every matching row on one page. */
export function printParams(params: ListParams): ListParams {
  return { ...params, page: 1, pageSize: PRINT_LIMIT };
}
