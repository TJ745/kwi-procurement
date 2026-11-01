export const PAGE_SIZE = 20;

export type ListParams = { query: string; page: number };

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
  page: number,
  count: () => Promise<number>,
  find: (args: { skip: number; take: number }) => Promise<T[]>,
): Promise<Paginated<T>> {
  const total = await count();
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const items =
    total === 0
      ? []
      : await find({ skip: (current - 1) * PAGE_SIZE, take: PAGE_SIZE });
  return { items, total, page: current, pageCount, pageSize: PAGE_SIZE };
}
