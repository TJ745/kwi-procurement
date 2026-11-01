"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";

export function FormActions({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <DialogFooter>
      <DialogClose render={<Button variant="outline" type="button" />}>
        Cancel
      </DialogClose>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Saving…" : "Save"}
      </Button>
    </DialogFooter>
  );
}
