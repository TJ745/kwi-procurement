"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Control, Controller, useFieldArray, useFormState, useWatch } from "react-hook-form";

import { ComboboxField } from "@/components/forms/combobox-field";
import { DateField } from "@/components/forms/date-field";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action-result";
import { computeTotals, formatMoney } from "@/lib/money";
import {
  EMPTY_PO_LINE,
  MAX_PO_LINES,
  type PurchaseOrderInput,
  purchaseOrderSchema,
} from "@/lib/validation/purchase-order";

type Option = { value: string; label: string };
type SupplierDetails = Pick<
  PurchaseOrderInput,
  | "supplierName"
  | "supplierAddress"
  | "supplierContactName"
  | "supplierContactNumber"
  | "supplierEmail"
  | "supplierTelephone"
  | "supplierVat"
>;

type PurchaseOrderFormProps = {
  action: (input: PurchaseOrderInput) => Promise<ActionResult>;
  defaultValues: PurchaseOrderInput;
  options: {
    projects: (Option & { name: string })[];
    departments: Option[];
    categories: Option[];
    suppliers: (Option & { details: SupplierDetails })[];
    currencies: Option[];
  };
  /** Existing number when editing; new orders are numbered on save. */
  number?: string;
  nextNumberPreview?: string;
  /** Source MR number, when raised from a material request. */
  materialRequestNumber?: string;
  cancelHref: string;
  dateFormat: string;
};

const LINE_COLUMNS =
  "md:grid-cols-[2.5rem_minmax(0,1fr)_7rem_7rem_8.5rem_9rem_2.25rem]";

export function PurchaseOrderForm({
  action,
  defaultValues,
  options,
  number,
  nextNumberPreview,
  materialRequestNumber,
  cancelHref,
  dateFormat,
}: PurchaseOrderFormProps) {
  const router = useRouter();
  const { form, onSubmit } = useActionForm({
    schema: purchaseOrderSchema,
    defaultValues,
    action,
    onSuccess: (result) => {
      // Pages stay mounted in the background between visits (Cache
      // Components / Activity), so clear the saved values first.
      form.reset();
      router.push(result.id ? `/purchase-orders/${result.id}` : "/purchase-orders");
    },
  });
  const { control, setValue, getValues } = form;
  const lines = useFieldArray({ control, name: "lines" });
  const isSubmitting = form.formState.isSubmitting;
  const linesError = form.formState.errors.lines?.root ?? form.formState.errors.lines;

  const [watchedLines, discount, vatRate, currency] = useWatch({
    control,
    name: ["lines", "discount", "vatRate", "currency"],
  });
  const totals = computeTotals({ lines: watchedLines ?? [], discount, vatRate, currency });

  function onSupplierSelect(id: string) {
    const supplier = options.suppliers.find((option) => option.value === id);
    if (!supplier) return;
    for (const [key, value] of Object.entries(supplier.details)) {
      setValue(key as keyof SupplierDetails, value, { shouldDirty: true, shouldValidate: true });
    }
  }

  function onProjectSelect(id: string) {
    const project = options.projects.find((option) => option.value === id);
    // Prefill Deliver To with the project name unless the user already typed one.
    const current = getValues("deliverTo").trim();
    const previous = options.projects.some((option) => option.name === current);
    if (project && (!current || previous)) setValue("deliverTo", project.name, { shouldValidate: true });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Purchase order</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ReadOnly label="PO Number">
              {number ? (
                <span className="font-mono font-medium">{number}</span>
              ) : (
                <span className="text-muted-foreground">
                  Assigned on save{nextNumberPreview ? ` (next: ${nextNumberPreview})` : ""}
                </span>
              )}
            </ReadOnly>
            <DateField control={control} name="orderDate" label="Order date" displayFormat={dateFormat} required />
            <ReadOnly label="MR Number">
              {materialRequestNumber ? (
                <span className="font-mono font-medium">{materialRequestNumber}</span>
              ) : (
                <span className="text-muted-foreground">Not raised from a material request</span>
              )}
            </ReadOnly>
            <ComboboxField control={control} name="projectId" label="Project" options={options.projects} placeholder="Search projects" required onSelect={onProjectSelect} />
            <ComboboxField control={control} name="departmentId" label="Ordered by (Department)" options={options.departments} placeholder="Search departments" required />
            <ComboboxField control={control} name="categoryId" label="Subject (Category)" options={options.categories} placeholder="Search categories" required />
            <div className="md:col-span-2 lg:col-span-3">
              <TextField control={control} name="deliverTo" label="Deliver to" required autoComplete="off" />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>To (supplier)</CardTitle>
          <CardDescription>
            Choosing a supplier fills in its details. You can adjust them for this order; they stay as issued.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ComboboxField control={control} name="supplierId" label="Supplier" options={options.suppliers} placeholder="Search suppliers" required onSelect={onSupplierSelect} />
            </div>
            <TextField control={control} name="supplierName" label="Company name" required autoComplete="off" />
            <TextField control={control} name="supplierVat" label="VAT number" autoComplete="off" />
            <div className="md:col-span-2">
              <TextField control={control} name="supplierAddress" label="Location" multiline />
            </div>
            <TextField control={control} name="supplierContactName" label="Contact person" autoComplete="off" />
            <TextField control={control} name="supplierContactNumber" label="Contact number" type="tel" autoComplete="off" />
            <TextField control={control} name="supplierEmail" label="Email" type="email" autoComplete="off" />
            <TextField control={control} name="supplierTelephone" label="Tel" type="tel" autoComplete="off" />
            <TextField control={control} name="quotationRef" label="Quotation reference" autoComplete="off" />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {lines.fields.length} of up to {MAX_PO_LINES} lines. Total = Quantity × Unit price.
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={lines.fields.length >= MAX_PO_LINES}
              onClick={() => lines.append({ ...EMPTY_PO_LINE }, { focusName: `lines.${lines.fields.length}.name` })}
            >
              <Plus />
              Add line
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className={`hidden gap-2 px-1 text-xs font-medium text-muted-foreground md:grid ${LINE_COLUMNS}`}>
            <span>Sr No</span>
            <span>Name *</span>
            <span>Unit *</span>
            <span>Quantity *</span>
            <span>Unit price *</span>
            <span className="text-right">Total</span>
            <span className="sr-only">Remove</span>
          </div>
          {lines.fields.map((line, index) => (
            <div
              key={line.id}
              className={`grid grid-cols-2 gap-2 rounded-lg border p-3 md:items-start md:rounded-none md:border-0 md:p-0 ${LINE_COLUMNS}`}
            >
              <div className="col-span-2 flex items-center justify-between md:col-span-1 md:h-8 md:justify-center">
                <span className="text-sm font-medium tabular-nums">
                  <span className="md:hidden">Line </span>
                  {index + 1}
                </span>
                <RemoveLineButton className="md:hidden" index={index} disabled={lines.fields.length === 1} onRemove={() => lines.remove(index)} />
              </div>
              <LineInput control={control} index={index} field="name" label="Name" className="col-span-2 md:col-span-1" />
              <LineInput control={control} index={index} field="unit" label="Unit" />
              <LineInput control={control} index={index} field="quantity" label="Quantity" numeric />
              <LineInput control={control} index={index} field="unitPrice" label="Unit price" numeric />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground md:sr-only">Total</span>
                <span className="flex h-8 items-center justify-end rounded-lg bg-muted/50 px-2.5 text-sm tabular-nums">
                  {formatMoney(totals.lineTotals[index] ?? "0", currency, false)}
                </span>
              </div>
              <RemoveLineButton className="hidden md:flex" index={index} disabled={lines.fields.length === 1} onRemove={() => lines.remove(index)} />
            </div>
          ))}
          {linesError?.message && (
            <p role="alert" className="text-sm text-destructive">
              {linesError.message}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
            <CardDescription>Starts from the default in Settings; changes apply to this order only.</CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="terms"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="field-terms" className="sr-only">
                    Terms & Conditions
                  </FieldLabel>
                  <textarea
                    {...field}
                    id="field-terms"
                    rows={8}
                    className="min-h-40 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </Field>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FieldGroup className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <SelectField control={control} name="currency" label="Currency" options={options.currencies} />
              </div>
              <TextField control={control} name="discount" label="Discount" inputMode="decimal" />
              <TextField control={control} name="vatRate" label="VAT %" inputMode="decimal" />
            </FieldGroup>
            <dl className="flex flex-col gap-1.5 border-t pt-3 text-sm tabular-nums">
              <TotalRow label="Subtotal" value={formatMoney(totals.subtotal, currency)} />
              <TotalRow label="Discount" value={`− ${formatMoney(totals.discount, currency)}`} />
              <TotalRow label={`VAT (${vatRate || 0}%)`} value={formatMoney(totals.vatAmount, currency)} />
              <div className="mt-1 flex items-center justify-between border-t pt-2 text-base font-semibold">
                <dt>Grand total</dt>
                <dd>{formatMoney(totals.total, currency)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Saving…" : "Save purchase order"}
        </Button>
      </div>
    </form>
  );
}

function ReadOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex h-8 items-center rounded-lg border border-dashed bg-muted/40 px-2.5 text-sm">
        {children}
      </div>
    </Field>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function RemoveLineButton({
  index,
  disabled,
  onRemove,
  className,
}: {
  index: number;
  disabled: boolean;
  onRemove: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={`text-muted-foreground hover:text-destructive ${className ?? ""}`}
      disabled={disabled}
      onClick={onRemove}
      aria-label={`Remove line ${index + 1}`}
    >
      <Trash2 />
    </Button>
  );
}

function LineInput({
  control,
  index,
  field: key,
  label,
  className,
  numeric,
}: {
  control: Control<PurchaseOrderInput>;
  index: number;
  field: "name" | "unit" | "quantity" | "unitPrice";
  label: string;
  className?: string;
  numeric?: boolean;
}) {
  const name = `lines.${index}.${key}` as const;
  const { errors } = useFormState({ control, name });
  const error = errors.lines?.[index]?.[key];
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={`flex flex-col gap-1 ${className ?? ""}`}>
          <label htmlFor={`field-${name}`} className="text-xs text-muted-foreground md:sr-only">
            {label}
            <span className="sr-only"> (line {index + 1})</span>
          </label>
          <Input
            {...field}
            id={`field-${name}`}
            inputMode={numeric ? "decimal" : undefined}
            autoComplete="off"
            aria-invalid={Boolean(error)}
            className={numeric ? "text-right tabular-nums" : undefined}
          />
          {error?.message && (
            <p role="alert" className="text-xs text-destructive">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
