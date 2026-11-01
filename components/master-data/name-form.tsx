"use client";

import { TextField } from "@/components/forms/text-field";
import { useActionForm } from "@/components/forms/use-action-form";
import { FormActions } from "@/components/master-data/form-actions";
import { useFormDialog } from "@/components/master-data/form-dialog";
import { FieldGroup } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { type DepartmentInput, departmentSchema } from "@/lib/validation/master-data";

type NameFormProps = {
  action: (input: DepartmentInput) => Promise<ActionResult>;
  defaultValues?: DepartmentInput;
};

/** Form for name-only master data (departments, categories). */
export function NameForm({ action, defaultValues }: NameFormProps) {
  const { close } = useFormDialog();
  const { form, onSubmit } = useActionForm({
    schema: departmentSchema,
    defaultValues: defaultValues ?? { name: "" },
    action,
    onSuccess: close,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" required autoFocus autoComplete="off" />
      </FieldGroup>
      <FormActions isSubmitting={form.formState.isSubmitting} />
    </form>
  );
}
