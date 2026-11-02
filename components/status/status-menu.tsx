"use client";

import { CheckIcon, ChevronDown, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ActionResult } from "@/lib/action-result";
export function StatusMenu<S extends string>({
  status,
  statuses,
  labels,
  action,
}: {
  status: S;
  statuses: readonly S[];
  labels: Record<S, string>;
  action: (status: S) => Promise<ActionResult>;
}) {
  const [isPending, startTransition] = useTransition();

  function change(next: S) {
    if (next === status) return;
    startTransition(async () => {
      try {
        const result = await action(next);
        if (result.ok) toast.success(`Status changed to ${labels[next]}.`);
        else toast.error(result.message);
      } catch {
        toast.error("Could not reach the server. Please try again.");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" disabled={isPending} />}>
        {isPending && <Loader2 className="animate-spin" />}
        Change status
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Set status</DropdownMenuLabel>
          {statuses.map((value) => (
            <DropdownMenuItem key={value} onClick={() => change(value)}>
              <span className="flex-1">{labels[value]}</span>
              {value === status && <CheckIcon />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
