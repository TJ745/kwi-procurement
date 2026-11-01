"use client";

import { TextField } from "@/components/forms/text-field";
import { useActionForm } from "@/components/forms/use-action-form";
import { FormActions } from "@/components/master-data/form-actions";
import { useFormDialog } from "@/components/master-data/form-dialog";
import { FieldGroup } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { type ProjectInput, projectSchema } from "@/lib/validation/master-data";

type ProjectFormProps = {
  action: (input: ProjectInput) => Promise<ActionResult>;
  defaultValues?: ProjectInput;
};

export function ProjectForm({ action, defaultValues }: ProjectFormProps) {
  const { close } = useFormDialog();
  const { form, onSubmit } = useActionForm({
    schema: projectSchema,
    defaultValues: defaultValues ?? { code: "", name: "" },
    action,
    onSuccess: close,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <TextField control={form.control} name="code" label="Code" required autoFocus autoComplete="off" />
        <TextField control={form.control} name="name" label="Name" required autoComplete="off" />
      </FieldGroup>
      <FormActions isSubmitting={form.formState.isSubmitting} />
    </form>
  );
}
