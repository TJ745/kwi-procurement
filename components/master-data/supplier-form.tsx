"use client";

import { useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/forms/choice-field";
import { TextField } from "@/components/forms/text-field";
import { useActionForm } from "@/components/forms/use-action-form";
import { FormActions } from "@/components/master-data/form-actions";
import { useFormDialog } from "@/components/master-data/form-dialog";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import {
  SUPPLIER_PAYMENT_TERMS,
  type SupplierInput,
  supplierSchema,
} from "@/lib/validation/master-data";

const EMPTY_SUPPLIER: SupplierInput = {
  name: "",
  vat: "",
  cr: "",
  iban: "",
  address: "",
  contactName: "",
  contactEmail: "",
  contactNumber: "",
  email: "",
  telephone: "",
  paymentTerm: "CASH",
  creditDays: "",
};

type SupplierFormProps = {
  action: (input: SupplierInput) => Promise<ActionResult>;
  defaultValues?: SupplierInput;
};

export function SupplierForm({ action, defaultValues }: SupplierFormProps) {
  const { close } = useFormDialog();
  const { form, onSubmit } = useActionForm({
    schema: supplierSchema,
    defaultValues: defaultValues ?? EMPTY_SUPPLIER,
    action,
    onSuccess: close,
  });
  const { control } = form;
  const paymentTerm = useWatch({ control, name: "paymentTerm" });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldSet>
        <FieldLegend variant="label">Company</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField control={control} name="name" label="Name" required autoFocus autoComplete="organization" />
          </div>
          <TextField control={control} name="vat" label="VAT" autoComplete="off" />
          <TextField control={control} name="cr" label="CR" autoComplete="off" />
          <div className="sm:col-span-2">
            <TextField control={control} name="iban" label="IBAN" autoComplete="off" />
          </div>
          <div className="sm:col-span-2">
            <TextField control={control} name="address" label="Address" multiline />
          </div>
          <TextField control={control} name="email" label="Email" type="email" autoComplete="off" />
          <TextField control={control} name="telephone" label="Telephone" type="tel" autoComplete="off" />
        </FieldGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend variant="label">Payment terms</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2 sm:items-start">
          <ChoiceField control={control} name="paymentTerm" label="Cash or credit" options={SUPPLIER_PAYMENT_TERMS} />
          {paymentTerm === "CREDIT" && (
            <TextField control={control} name="creditDays" label="Credit days" inputMode="numeric" autoComplete="off" />
          )}
        </FieldGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend variant="label">Contact person</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField control={control} name="contactName" label="Contact name" autoComplete="off" />
          </div>
          <TextField control={control} name="contactEmail" label="Contact email" type="email" autoComplete="off" />
          <TextField control={control} name="contactNumber" label="Contact number" type="tel" autoComplete="off" />
        </FieldGroup>
      </FieldSet>
      <FormActions isSubmitting={form.formState.isSubmitting} />
    </form>
  );
}
