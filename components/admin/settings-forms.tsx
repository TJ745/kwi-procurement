"use client";

import { Loader2 } from "lucide-react";
import { useWatch } from "react-hook-form";

import { SelectField } from "@/components/forms/select-field";
import { SwitchField } from "@/components/forms/switch-field";
import { TextField } from "@/components/forms/text-field";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { formatDocumentNumber } from "@/lib/document-numbering";
import { DATE_FORMATS } from "@/lib/format";
import {
  type CompanySettingsInput,
  type DocumentSequenceInput,
  type PurchaseOrderDefaultsInput,
  type RegionalSettingsInput,
  type SecuritySettingsInput,
  companySettingsSchema,
  documentSequenceSchema,
  purchaseOrderDefaultsSchema,
  regionalSettingsSchema,
  securitySettingsSchema,
} from "@/lib/validation/admin";

type Option = { value: string; label: string };

function SaveButton({ isSubmitting, isDirty }: { isSubmitting: boolean; isDirty: boolean }) {
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

export function CompanySettingsForm({
  defaultValues,
  action,
}: {
  defaultValues: CompanySettingsInput;
  action: (input: CompanySettingsInput) => Promise<ActionResult>;
}) {
  const { form, onSubmit } = useActionForm({ schema: companySettingsSchema, defaultValues, action, resetOnSuccess: true });
  const { control } = form;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField control={control} name="companyName" label="Company name" autoComplete="organization" />
        </div>
        <div className="sm:col-span-2">
          <TextField control={control} name="companyAddress" label="Address" multiline />
        </div>
        <TextField control={control} name="companyVat" label="VAT" autoComplete="off" />
        <TextField control={control} name="companyCr" label="CR" autoComplete="off" />
        <TextField control={control} name="companyPhone" label="Phone" type="tel" autoComplete="off" />
        <TextField control={control} name="companyEmail" label="Email" type="email" autoComplete="off" />
      </FieldGroup>
      <SaveButton isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} />
    </form>
  );
}

export function RegionalSettingsForm({
  defaultValues,
  action,
  currencies,
  timeZones,
}: {
  defaultValues: RegionalSettingsInput;
  action: (input: RegionalSettingsInput) => Promise<ActionResult>;
  currencies: Option[];
  timeZones: Option[];
}) {
  const { form, onSubmit } = useActionForm({ schema: regionalSettingsSchema, defaultValues, action, resetOnSuccess: true });
  const { control } = form;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-3">
        <SelectField control={control} name="currency" label="Default currency" options={currencies} />
        <SelectField control={control} name="timeZone" label="Time zone" options={timeZones} />
        <SelectField control={control} name="dateFormat" label="Date format" options={DATE_FORMATS} />
      </FieldGroup>
      <SaveButton isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} />
    </form>
  );
}

export function SecuritySettingsForm({
  defaultValues,
  action,
}: {
  defaultValues: SecuritySettingsInput;
  action: (input: SecuritySettingsInput) => Promise<ActionResult>;
}) {
  const { form, onSubmit } = useActionForm({ schema: securitySettingsSchema, defaultValues, action, resetOnSuccess: true });
  const { control } = form;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <TextField
          control={control}
          name="sessionDurationHours"
          label="Session duration (hours)"
          description="Users are signed out this long after signing in (1–720). Applies to new sign-ins."
          inputMode="numeric"
        />
        <TextField
          control={control}
          name="minPasswordLength"
          label="Minimum password length"
          description="Applies to new and reset passwords (8–128). Existing passwords are not affected."
          inputMode="numeric"
        />
      </FieldGroup>
      <SaveButton isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} />
    </form>
  );
}

export function PurchaseOrderDefaultsForm({
  defaultValues,
  action,
}: {
  defaultValues: PurchaseOrderDefaultsInput;
  action: (input: PurchaseOrderDefaultsInput) => Promise<ActionResult>;
}) {
  const { form, onSubmit } = useActionForm({ schema: purchaseOrderDefaultsSchema, defaultValues, action, resetOnSuccess: true });
  const { control } = form;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <div className="sm:max-w-48">
          <TextField control={control} name="defaultVatRate" label="Default VAT %" inputMode="decimal" />
        </div>
        <TextField
          control={control}
          name="purchaseOrderTerms"
          label="Default Terms & Conditions"
          description="New purchase orders start with this text; it can be adjusted on each PO."
          multiline
        />
      </FieldGroup>
      <SaveButton isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} />
    </form>
  );
}

export function DocumentSequenceForm({
  label,
  defaultValues,
  action,
  currentYear,
}: {
  label: string;
  defaultValues: DocumentSequenceInput;
  action: (input: DocumentSequenceInput) => Promise<ActionResult>;
  currentYear: number;
}) {
  const { form, onSubmit } = useActionForm({ schema: documentSequenceSchema, defaultValues, action, resetOnSuccess: true });
  const { control } = form;
  const values = useWatch({ control });
  const includeYear = Boolean(values.includeYear);
  const valid = documentSequenceSchema.safeParse(values);
  const preview = valid.success
    ? formatDocumentNumber(
        {
          prefix: valid.data.prefix.toUpperCase(),
          includeYear: valid.data.includeYear,
          padding: Number(valid.data.padding),
        },
        Number(valid.data.nextNumber),
        currentYear,
      )
    : "—";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{label}</h3>
        <p className="text-sm text-muted-foreground">
          Next number: <span className="font-mono font-medium text-foreground">{preview}</span>
        </p>
      </div>
      <FieldGroup className="grid gap-4 sm:grid-cols-3">
        <TextField control={control} name="prefix" label="Prefix" autoComplete="off" />
        <TextField control={control} name="padding" label="Digits" inputMode="numeric" />
        <TextField control={control} name="nextNumber" label="Next number" inputMode="numeric" />
      </FieldGroup>
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <SwitchField control={control} name="includeYear" label="Include year" />
        <SwitchField
          control={control}
          name="resetYearly"
          label="Restart at 1 each year"
          disabled={!includeYear}
          description={includeYear ? undefined : "Requires the year in the number."}
        />
      </FieldGroup>
      <SaveButton isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} />
    </form>
  );
}
