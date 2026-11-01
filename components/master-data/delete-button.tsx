"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

type DeleteButtonProps = {
  /** Human-readable record name shown in the confirmation, e.g. "ABC – Tower". */
  itemLabel: string;
  entityLabel: string;
  action: () => Promise<ActionResult>;
  /** Where to go after deleting, e.g. back to the list from a detail page. */
  redirectTo?: string;
  variant?: "icon" | "button";
};

export function DeleteButton({
  itemLabel,
  entityLabel,
  action,
  redirectTo,
  variant = "icon",
}: DeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      let result: ActionResult;
      try {
        result = await action();
      } catch {
        toast.error("Could not reach the server. Please try again.");
        return;
      }
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      {variant === "icon" ? (
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${entityLabel} ${itemLabel}`}
              className="text-muted-foreground hover:text-destructive"
            />
          }
        >
          <Trash2 />
        </AlertDialogTrigger>
      ) : (
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          <Trash2 />
          Delete
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{itemLabel}</span>{" "}
            will be permanently deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
