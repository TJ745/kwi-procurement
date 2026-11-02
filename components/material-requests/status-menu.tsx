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
import {
  MATERIAL_REQUEST_STATUSES,
  MATERIAL_REQUEST_STATUS_LABELS,
  type MaterialRequestStatusValue,
} from "@/lib/validation/material-request";

export function StatusMenu({
  status,
  action,
}: {
  status: MaterialRequestStatusValue;
  action: (status: MaterialRequestStatusValue) => Promise<ActionResult>;
}) {
  const [isPending, startTransition] = useTransition();

  function change(next: MaterialRequestStatusValue) {
    if (next === status) return;
    startTransition(async () => {
      try {
        const result = await action(next);
        if (result.ok) toast.success(`Status changed to ${MATERIAL_REQUEST_STATUS_LABELS[next]}.`);
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
          {MATERIAL_REQUEST_STATUSES.map((value) => (
            <DropdownMenuItem key={value} onClick={() => change(value)}>
              <span className="flex-1">{MATERIAL_REQUEST_STATUS_LABELS[value]}</span>
              {value === status && <CheckIcon />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
