"use client";

import { PasswordField } from "@/components/admin/password-field";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { useActionForm } from "@/components/forms/use-action-form";
import { FormActions } from "@/components/master-data/form-actions";
import { useFormDialog } from "@/components/master-data/form-dialog";
import { FieldGroup } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import {
  type CreateUserInput,
  type ResetPasswordInput,
  type UserInput,
  createUserSchema,
  resetPasswordSchema,
  userSchema,
} from "@/lib/validation/admin";

type RoleOption = { value: string; label: string };

function passwordHint(minLength: number) {
  return `At least ${minLength} characters. The user must change it at first sign-in.`;
}

export function CreateUserForm({
  action,
  roles,
  minPasswordLength,
}: {
  action: (input: CreateUserInput) => Promise<ActionResult>;
  roles: RoleOption[];
  minPasswordLength: number;
}) {
  const { close } = useFormDialog();
  const { form, onSubmit } = useActionForm({
    schema: createUserSchema,
    defaultValues: { name: "", email: "", roleId: "", temporaryPassword: "" },
    action,
    onSuccess: close,
  });
  const { control } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <TextField control={control} name="name" label="Name" required autoFocus autoComplete="off" />
        <TextField control={control} name="email" label="Email" type="email" required autoComplete="off" />
        <SelectField control={control} name="roleId" label="Role" options={roles} placeholder="Select a role" required />
        <PasswordField
          control={control}
          name="temporaryPassword"
          label="Temporary password"
          description={passwordHint(minPasswordLength)}
          autoComplete="new-password"
          generateLength={Math.max(minPasswordLength, 16)}
        />
      </FieldGroup>
      <FormActions isSubmitting={form.formState.isSubmitting} />
    </form>
  );
}

export function EditUserForm({
  action,
  roles,
  defaultValues,
}: {
  action: (input: UserInput) => Promise<ActionResult>;
  roles: RoleOption[];
  defaultValues: UserInput;
}) {
  const { close } = useFormDialog();
  const { form, onSubmit } = useActionForm({
    schema: userSchema,
    defaultValues,
    action,
    onSuccess: close,
  });
  const { control } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <TextField control={control} name="name" label="Name" required autoFocus autoComplete="off" />
        <TextField control={control} name="email" label="Email" type="email" required autoComplete="off" />
        <SelectField control={control} name="roleId" label="Role" options={roles} placeholder="Select a role" required />
      </FieldGroup>
      <FormActions isSubmitting={form.formState.isSubmitting} />
    </form>
  );
}

export function ResetPasswordForm({
  action,
  minPasswordLength,
}: {
  action: (input: ResetPasswordInput) => Promise<ActionResult>;
  minPasswordLength: number;
}) {
  const { close } = useFormDialog();
  const { form, onSubmit } = useActionForm({
    schema: resetPasswordSchema,
    defaultValues: { temporaryPassword: "" },
    action,
    onSuccess: close,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <PasswordField
          control={form.control}
          name="temporaryPassword"
          label="Temporary password"
          description={`${passwordHint(minPasswordLength)} They will be signed out everywhere.`}
          autoComplete="new-password"
          generateLength={Math.max(minPasswordLength, 16)}
        />
      </FieldGroup>
      <FormActions isSubmitting={form.formState.isSubmitting} />
    </form>
  );
}
