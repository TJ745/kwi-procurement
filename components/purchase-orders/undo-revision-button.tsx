"use client";

import { Loader2, Undo2 } from "lucide-react";
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

type UndoRevisionButtonProps = {
  /** The current number, e.g. "PO-2026-0006-R2". */
  currentNumber: string;
  /** The number it goes back to, e.g. "PO-2026-0006-R1". */
  previousNumber: string;
  action: () => Promise<ActionResult>;
};

/** Confirms, then puts the order back to its previous version. */
export function UndoRevisionButton({ currentNumber, previousNumber, action }: UndoRevisionButtonProps) {
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
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        <Undo2 />
        Undo last revision
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Undo revision {currentNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            The order goes back to{" "}
            <span className="font-medium text-foreground">{previousNumber}</span> exactly as it was: its details,
            items, totals and terms. The changes made in {currentNumber} are discarded. Use this only for a revision
            made by mistake.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? "Undoing…" : `Back to ${previousNumber}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
