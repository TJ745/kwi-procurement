import { Skeleton } from "@/components/ui/skeleton";

/** Static placeholder shown while the session and shell are resolved. */
export function AppShellSkeleton() {
  return (
    <div className="flex min-h-svh w-full" aria-busy="true">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 md:flex">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-6 w-full" />
        ))}
      </aside>
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center gap-3 border-b px-4 md:px-6">
          <Skeleton className="size-7" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ml-auto size-8 rounded-full" />
        </div>
        <div className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <PageSkeleton />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
