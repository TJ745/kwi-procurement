"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type DefaultValues, type FieldValues, type Path, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import type { ActionResult } from "@/lib/action-result";

type UseActionFormOptions<T extends FieldValues> = {
  schema: z.ZodType<T, T>;
  defaultValues: DefaultValues<T>;
  action: (input: T) => Promise<ActionResult>;
  onSuccess?: () => void;
};

/**
 * React Hook Form wired to a Server Action: validates on the client with the
 * same Zod schema the server uses, then shows the server's result as a toast
 * and maps server-side field errors back onto the form.
 */
export function useActionForm<T extends FieldValues>({
  schema,
  defaultValues,
  action,
  onSuccess,
}: UseActionFormOptions<T>) {
  const form = useForm<T>({ resolver: zodResolver(schema), defaultValues });

  const onSubmit = form.handleSubmit(async (values) => {
    let result: ActionResult;
    try {
      result = await action(values);
    } catch {
      toast.error("Could not reach the server. Please try again.");
      return;
    }
    if (result.ok) {
      toast.success(result.message);
      onSuccess?.();
      return;
    }
    toast.error(result.message);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      form.setError(field as Path<T>, { message });
    }
  });

  return { form, onSubmit };
}
