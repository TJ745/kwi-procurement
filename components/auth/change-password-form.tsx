"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PasswordField } from "@/components/admin/password-field";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { changeOwnPassword } from "@/lib/actions/account";
import { changePasswordSchema } from "@/lib/validation/admin";

export function ChangePasswordForm({
  minPasswordLength,
  forced,
  successHref,
}: {
  minPasswordLength: number;
  /** True when an administrator set a temporary password. */
  forced: boolean;
  /** Where to go after success; omit to stay on the page (e.g. Profile). */
  successHref?: string;
}) {
  const router = useRouter();
  const { form, onSubmit } = useActionForm({
    schema: changePasswordSchema,
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    action: changeOwnPassword,
    onSuccess: () => {
      if (successHref) router.replace(successHref);
      // Staying on the page: clear the password fields.
      else form.reset();
      router.refresh();
    },
  });
  const { control } = form;
  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <PasswordField
          control={control}
          name="currentPassword"
          label={forced ? "Temporary password" : "Current password"}
          autoComplete="current-password"
        />
        <PasswordField
          control={control}
          name="newPassword"
          label="New password"
          description={`At least ${minPasswordLength} characters. Other devices will be signed out.`}
          autoComplete="new-password"
        />
        <PasswordField
          control={control}
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {!forced && successHref && (
            <Link href={successHref} className={buttonVariants({ variant: "outline" })}>
              Cancel
            </Link>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? "Saving…" : "Change password"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
