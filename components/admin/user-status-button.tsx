"use client";

import { Loader2, UserCheck, UserX } from "lucide-react";
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

type UserStatusButtonProps = {
  userName: string;
  active: boolean;
  /** Sets the user's active flag to the given value. */
  action: (active: boolean) => Promise<ActionResult>;
};

export function UserStatusButton({ userName, active, action }: UserStatusButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const verb = active ? "Deactivate" : "Reactivate";

  function onConfirm() {
    startTransition(async () => {
      let result: ActionResult;
      try {
        result = await action(!active);
      } catch {
        toast.error("Could not reach the server. Please try again.");
        return;
      }
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${verb} ${userName}`}
            className={active ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground"}
          />
        }
      >
        {active ? <UserX /> : <UserCheck />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{verb} user?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{userName}</span>{" "}
            {active
              ? "will be signed out immediately and will not be able to sign in. Their record is kept and they can be reactivated later."
              : "will be able to sign in again with their current password."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={active ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {verb}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
