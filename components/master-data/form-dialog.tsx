"use client";

import { KeyRound, Pencil, Plus } from "lucide-react";
import { createContext, useContext, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FormDialogContext = createContext<{ close: () => void } | null>(null);

/** Lets a form inside a FormDialog close it after a successful save. */
export function useFormDialog() {
  const context = useContext(FormDialogContext);
  if (!context) throw new Error("useFormDialog must be used within a FormDialog.");
  return context;
}

const ICONS = { edit: Pencil, password: KeyRound };

type FormDialogProps = {
  mode: "create" | "edit";
  title: string;
  description?: string;
  /** Accessible label for the edit trigger, e.g. "Edit project ABC". */
  triggerLabel: string;
  size?: "default" | "lg";
  /** Icon for the edit-mode trigger (a key, as icons can't cross the server boundary). */
  icon?: keyof typeof ICONS;
  children: React.ReactNode;
};

export function FormDialog({
  mode,
  title,
  description,
  triggerLabel,
  size = "default",
  icon = "edit",
  children,
}: FormDialogProps) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[icon];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <DialogTrigger render={<Button />}>
          <Plus />
          {triggerLabel}
        </DialogTrigger>
      ) : (
        <DialogTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={triggerLabel} />}
        >
          <Icon />
        </DialogTrigger>
      )}
      <DialogContent
        className={cn(
          "max-h-[calc(100svh-2rem)] overflow-y-auto",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <FormDialogContext.Provider value={{ close: () => setOpen(false) }}>
          {children}
        </FormDialogContext.Provider>
      </DialogContent>
    </Dialog>
  );
}
