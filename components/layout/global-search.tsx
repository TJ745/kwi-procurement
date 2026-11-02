"use client";

import { Loader2, Search, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SearchGroup, SearchResult } from "@/lib/search";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 2;

/** Debounced fetch of /api/search; results are keyed by the query they answer. */
function useSearchResults(query: string) {
  const [state, setState] = useState<{ query: string; groups: SearchGroup[] }>({ query: "", groups: [] });
  const term = query.trim();

  useEffect(() => {
    if (term.length < MIN_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = response.ok ? ((await response.json()) as { groups: SearchGroup[] }) : { groups: [] };
        setState({ query: term, groups: data.groups });
      } catch {
        // Aborted by a newer query, or offline.
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const active = term.length >= MIN_LENGTH;
  return {
    active,
    loading: active && state.query !== term,
    groups: active && state.query === term ? state.groups : [],
  };
}

function SearchPanel({
  autoFocus,
  inputRef,
  onNavigate,
  floating,
}: {
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onNavigate?: () => void;
  /** Desktop: results float below the input and close on blur. */
  floating?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const [highlight, setHighlight] = useState(0);
  const { active, loading, groups } = useSearchResults(query);
  const flat: SearchResult[] = groups.flatMap((group) => group.results);
  // Position of each group's first result in `flat`, for keyboard highlight.
  const offsets = groups.map((_, i) => groups.slice(0, i).reduce((sum, g) => sum + g.results.length, 0));
  const showResults = active && (!floating || focused);

  function go(result: SearchResult | undefined) {
    if (!result) return;
    setQuery("");
    setFocused(false);
    inputRef?.current?.blur();
    onNavigate?.();
    router.push(result.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => Math.min(index + 1, flat.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(flat[highlight]);
    } else if (event.key === "Escape") {
      setQuery("");
      inputRef?.current?.blur();
    }
  }

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showResults}
        aria-controls={listId}
        aria-activedescendant={showResults && flat[highlight] ? `${listId}-${highlight}` : undefined}
        aria-label="Search"
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlight(0);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        placeholder="Search requests, projects, suppliers…"
        className="h-9 w-full rounded-lg border border-input bg-muted/40 pr-14 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <span className="absolute top-1/2 right-2 -translate-y-1/2">
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          floating && (
            <kbd className="hidden rounded border bg-background px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground lg:inline">
              Ctrl K
            </kbd>
          )
        )}
      </span>
      {showResults && (
        <div
          id={listId}
          role="listbox"
          // Keep focus in the input while clicking a result.
          onMouseDown={(event) => event.preventDefault()}
          className={cn(
            "overflow-y-auto rounded-lg bg-popover text-sm text-popover-foreground",
            floating
              ? "absolute inset-x-0 top-full z-50 mt-1.5 max-h-[min(28rem,70svh)] shadow-lg ring-1 ring-foreground/10"
              : "mt-3 max-h-[60svh]",
          )}
        >
          {!loading && groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-muted-foreground">
              <SearchX className="size-5" />
              No results for “{query.trim()}”.
            </div>
          ) : (
            groups.map((group, groupIndex) => (
              <div key={group.label} role="group" aria-label={group.label} className="p-1">
                <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
                {group.results.map((result, resultIndex) => {
                  const current = offsets[groupIndex] + resultIndex;
                  return (
                    <div
                      key={result.id}
                      id={`${listId}-${current}`}
                      role="option"
                      aria-selected={current === highlight}
                      onMouseEnter={() => setHighlight(current)}
                      onClick={() => go(result)}
                      className={cn(
                        "flex cursor-pointer flex-col rounded-md px-2 py-1.5",
                        current === highlight && "bg-accent text-accent-foreground",
                      )}
                    >
                      <span className="truncate font-medium">{result.title}</span>
                      {result.subtitle && (
                        <span className="truncate text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function GlobalSearch() {
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Ctrl/Cmd + K opens search from anywhere.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (isMobile) setDialogOpen(true);
        else inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile]);

  return (
    <>
      <div className="hidden w-full max-w-md md:block">
        <SearchPanel inputRef={inputRef} floating />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Search"
        onClick={() => setDialogOpen(true)}
      >
        <Search />
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="top-4 translate-y-0 sm:max-w-lg" showCloseButton={false}>
          <DialogTitle className="sr-only">Search</DialogTitle>
          <SearchPanel autoFocus onNavigate={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
