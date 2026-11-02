"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import type { NotificationFeed } from "@/lib/data/notifications";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

export function NotificationBell({ initialFeed }: { initialFeed: NotificationFeed }) {
  const router = useRouter();
  const [feed, setFeed] = useState(initialFeed);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (response.ok) setFeed((await response.json()) as NotificationFeed);
    } catch {
      // Offline or server unavailable: keep showing the last feed.
    }
  }, []);

  // Poll the server so new notifications appear without a page reload.
  useEffect(() => {
    const timer = setInterval(reload, POLL_MS);
    const onFocus = () => void reload();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [reload]);

  function openItem(item: NotificationFeed["items"][number]) {
    setOpen(false);
    if (!item.readAt) {
      setFeed((current) => ({
        unread: Math.max(0, current.unread - 1),
        items: current.items.map((each) =>
          each.id === item.id ? { ...each, readAt: new Date().toISOString() } : each,
        ),
      }));
      void markNotificationRead(item.id);
    }
    if (item.href.startsWith("/")) router.push(item.href);
  }

  function markAll() {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      await reload();
    });
  }

  const label = feed.unread > 0 ? `Notifications (${feed.unread} unread)` : "Notifications";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void reload();
      }}
    >
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={label} className="relative" />}>
        <Bell />
        {feed.unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground tabular-nums">
            {feed.unread > 99 ? "99+" : feed.unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] gap-0 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          <Button variant="ghost" size="xs" onClick={markAll} disabled={isPending || feed.unread === 0}>
            <CheckCheck />
            Mark all read
          </Button>
        </div>
        {feed.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
            <BellOff className="size-5" />
            You have no notifications.
          </div>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1">
            {feed.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className={cn(
                    "flex w-full gap-2.5 px-3 py-2.5 text-left outline-none hover:bg-accent focus-visible:bg-accent",
                    !item.readAt && "bg-primary/5",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.readAt ? "bg-transparent" : "bg-primary")}
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className={cn("text-sm", !item.readAt && "font-medium")}>
                      {item.title}
                      {!item.readAt && <span className="sr-only"> (unread)</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.body}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
