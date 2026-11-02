/** Shapes returned by GET /api/search (see app/api/search/route.ts). */
export type SearchResult = { id: string; title: string; subtitle?: string; href: string };
export type SearchGroup = { label: string; results: SearchResult[] };
