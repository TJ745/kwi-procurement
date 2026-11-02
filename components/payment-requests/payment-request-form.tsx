"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/forms/choice-field";
import { ComboboxField } from "@/components/forms/combobox-field";
import { DateField } from "@/components/forms/date-field";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { amountInWords } from "@/lib/amount-in-words";
import type { PurchaseOrderBalance } from "@/lib/data/payment-requests";
import { formatMoney } from "@/lib/money";
import {
  OTHERS_ITEM,
  PAYMENT_ITEM_GROUPS,
  PAYMENT_PRIORITIES,
  PAYMENT_TYPES,
  type PaymentItemKey,
} from "@/lib/payment-request-options";
import { cn } from "@/lib/utils";
import { type PaymentRequestInput, paymentRequestSchema } from "@/lib/validation/payment-request";

type Option = { value: string; label: string };

type PaymentRequestFormProps = {
  action: (input: PaymentRequestInput) => Promise<ActionResult>;
  defaultValues: PaymentRequestInput;
  options: { projects: Option[]; suppliers: Option[]; currencies: Option[] };
  number?: string;
  nextNumberPreview?: string;
  /** Source PO and its balance (excluding this request when editing). */
  purchaseOrder?: PurchaseOrderBalance;
  cancelHref: string;
  dateFormat: string;
};

export function PaymentRequestForm({
  action,
  defaultValues,
  options,
  number,
  nextNumberPreview,
  purchaseOrder,
  cancelHref,
  dateFormat,
}: PaymentRequestFormProps) {
  const router = useRouter();
  const { form, onSubmit } = useActionForm({
    schema: paymentRequestSchema,
    defaultValues,
    action,
    onSuccess: (result) => {
      // Pages stay mounted in the background between visits; start clean.
      form.reset();
      router.push(result.id ? `/payment-requests/${result.id}` : "/payment-requests");
    },
  });
  const { control, setValue, getValues } = form;
  const isSubmitting = form.formState.isSubmitting;
  const [amount, currency, items] = useWatch({ control, name: ["amount", "currency", "items"] });
  const validAmount = /^\d{1,13}(\.\d{1,3})?$/.test(amount.trim()) && Number(amount) > 0;
  const othersTicked = items.includes(OTHERS_ITEM);

  function onSupplierSelect(id: string) {
    const supplier = options.suppliers.find((option) => option.value === id);
    // Fill "In favor of" unless the user typed something else.
    const current = getValues("inFavorOf").trim();
    const previous = options.suppliers.some((option) => option.label === current);
    if (supplier && (!current || previous)) setValue("inFavorOf", supplier.label, { shouldValidate: true });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment request</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ReadOnly label="PR Number">
              {number ? (
                <span className="font-mono font-medium">{number}</span>
              ) : (
                <span className="text-muted-foreground">
                  Assigned on save{nextNumberPreview ? ` (next: ${nextNumberPreview})` : ""}
                </span>
              )}
            </ReadOnly>
            <DateField control={control} name="requestDate" label="Date" displayFormat={dateFormat} required />
            <ReadOnly label="PO Ref">
              {purchaseOrder ? (
                <span className="font-mono font-medium">{purchaseOrder.number}</span>
              ) : (
                <span className="text-muted-foreground">Not against a purchase order</span>
              )}
            </ReadOnly>
            <ComboboxField control={control} name="projectId" label="Project" options={options.projects} placeholder="Search projects" required />
            <ComboboxField control={control} name="supplierId" label="Supplier" options={options.suppliers} placeholder="Optional" onSelect={onSupplierSelect} />
            <TextField control={control} name="inFavorOf" label="In favor of" required autoComplete="off" />
            <div className="md:col-span-2 lg:col-span-3">
              <TextField control={control} name="description" label="Description" required multiline />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment for</CardTitle>
          <CardDescription>Tick every item that applies (at least one).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Controller
            control={control}
            name="items"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {PAYMENT_ITEM_GROUPS.map((group) => (
                    <fieldset key={group.key} className="flex flex-col gap-2 rounded-lg border p-3">
                      <legend className="px-1 text-sm font-medium">{group.label}</legend>
                      {group.items.map((item) => {
                        const id = `item-${item.key}`;
                        const checked = field.value.includes(item.key);
                        return (
                          <label key={item.key} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                              id={id}
                              checked={checked}
                              onCheckedChange={(next) =>
                                field.onChange(
                                  next
                                    ? [...field.value, item.key]
                                    : field.value.filter((value: PaymentItemKey) => value !== item.key),
                                )
                              }
                            />
                            {item.label}
                          </label>
                        );
                      })}
                    </fieldset>
                  ))}
                </div>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          {othersTicked && (
            <div className="max-w-md">
              <TextField control={control} name="otherDetails" label="Others (specify)" required autoComplete="off" />
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <ChoiceField control={control} name="paymentType" label="Type of payment" options={PAYMENT_TYPES} />
            <ChoiceField control={control} name="priority" label="Priority" options={PAYMENT_PRIORITIES} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amount</CardTitle>
          {purchaseOrder && (
            <CardDescription>
              PO total {formatMoney(purchaseOrder.total, purchaseOrder.currency)} · already requested{" "}
              {formatMoney(purchaseOrder.requested, purchaseOrder.currency)} · remaining{" "}
              <span className="font-medium text-foreground">
                {formatMoney(purchaseOrder.remaining, purchaseOrder.currency)}
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            {purchaseOrder ? (
              <ReadOnly label="Currency">{purchaseOrder.currency}</ReadOnly>
            ) : (
              <SelectField control={control} name="currency" label="Currency" options={options.currencies} />
            )}
            <TextField control={control} name="amount" label="Amount" required inputMode="decimal" />
            <TextField control={control} name="invoiceNo" label="Invoice No" autoComplete="off" />
            <div className="md:col-span-2">
              <ReadOnly label="Amount in words">
                <span className={cn("truncate", !validAmount && "text-muted-foreground")}>
                  {validAmount ? amountInWords(amount.trim(), currency) : "Enter an amount"}
                </span>
              </ReadOnly>
            </div>
            <TextField control={control} name="quotationNo" label="Quotation No" autoComplete="off" />
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Saving…" : "Save payment request"}
        </Button>
      </div>
    </form>
  );
}

function ReadOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex min-h-8 items-center rounded-lg border border-dashed bg-muted/40 px-2.5 py-1 text-sm">
        {children}
      </div>
    </Field>
  );
}
