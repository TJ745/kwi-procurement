import "server-only";

import type { ListParams } from "@/lib/data/list-params";

/** Human-readable filter summary for a print header. */
export function describeFilters(params: ListParams, extra: (string | false | null | undefined)[] = []) {
  return [params.query && `Search: “${params.query}”`, ...extra].filter(Boolean) as string[];
}
