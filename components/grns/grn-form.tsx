"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Control, Controller, useFormState, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/forms/choice-field";
import { ComboboxField } from "@/components/forms/combobox-field";
import { DateField } from "@/components/forms/date-field";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { ActionResult } from "@/lib/action-result";
import type { GrnSourceLine } from "@/lib/data/grns";
import { formatQuantity } from "@/lib/format";
import { DELIVERY_METHODS, lineQuantities } from "@/lib/grn";
import { type GrnInput, grnSchema } from "@/lib/validation/grn";

type Option = { value: string; label: string };

type GrnFormProps = {
  action: (input: GrnInput) => Promise<ActionResult>;
  defaultValues: GrnInput;
  departments: Option[];
  /** PO lines in order, with what is still outstanding on each. */
  sourceLines: GrnSourceLine[];
  header: {
    number?: string;
    nextNumberPreview?: string;
    poNumber: string;
    mrNumber: string | null;
    projectName: string;
    projectCode: string;
  };
  cancelHref: string;
  dateFormat: string;
};

export function GrnForm({
  action,
  defaultValues,
  departments,
  sourceLines,
  header,
  cancelHref,
  dateFormat,
}: GrnFormProps) {
  const router = useRouter();
  const { form, onSubmit } = useActionForm({
    schema: grnSchema,
    defaultValues,
    action,
    onSuccess: (result) => {
      // Pages stay mounted in the background between visits; start clean.
      form.reset();
      router.push(result.id ? `/grn/${result.id}` : "/grn");
    },
  });
  const { control } = form;
  const isSubmitting = form.formState.isSubmitting;
  const watched = useWatch({ control, name: "lines" });
  const linesError = form.formState.errors.lines?.root ?? form.formState.errors.lines;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Goods received note</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ReadOnly label="GRN Number">
              {header.number ? (
                <span className="font-mono font-medium">{header.number}</span>
              ) : (
                <span className="text-muted-foreground">
                  Assigned on save{header.nextNumberPreview ? ` (next: ${header.nextNumberPreview})` : ""}
                </span>
              )}
            </ReadOnly>
            <DateField control={control} name="receiptDate" label="Date" displayFormat={dateFormat} required />
            <ReadOnly label="PO Ref">
              <span className="font-mono font-medium">{header.poNumber}</span>
            </ReadOnly>
            <ReadOnly label="MR Ref">
              {header.mrNumber ? (
                <span className="font-mono font-medium">{header.mrNumber}</span>
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </ReadOnly>
            <ReadOnly label="Project name">{header.projectName}</ReadOnly>
            <ReadOnly label="Project code">{header.projectCode}</ReadOnly>
            <ComboboxField control={control} name="departmentId" label="Ordered by (Department)" options={departments} placeholder="Search departments" required />
            <TextField control={control} name="invoiceNo" label="Invoice No" autoComplete="off" />
            <div className="md:col-span-2 lg:col-span-4">
              <ChoiceField control={control} name="deliveredBy" label="Delivered by" options={DELIVERY_METHODS} />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>From (supplier)</CardTitle>
          <CardDescription>Copied from the purchase order; adjust if needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <TextField control={control} name="supplierName" label="Supplier name" required autoComplete="off" />
            <TextField control={control} name="supplierAddress" label="Address" multiline />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="gap-0">
        <CardHeader className="border-b pb-4">
          <CardTitle>Items</CardTitle>
          <CardDescription>
            Enter what arrived. Short and Excess compare Received with the quantity still outstanding;
            Accepted = Received − Rejected.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[72rem] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <Th className="w-12 pl-4">Sr No</Th>
                <Th className="w-28">PO No</Th>
                <Th className="w-32">Item code</Th>
                <Th>Item description</Th>
                <Th className="w-44">Dept</Th>
                <Th className="w-20">Unit</Th>
                <Th className="w-24 text-right">Ordered</Th>
                <Th className="w-24 text-right">Outstanding</Th>
                <Th className="w-28">Received *</Th>
                <Th className="w-20 text-right">Short</Th>
                <Th className="w-20 text-right">Excess</Th>
                <Th className="w-28">Rejected</Th>
                <Th className="w-24 pr-4 text-right">Accepted</Th>
              </tr>
            </thead>
            <tbody>
              {sourceLines.map((line, index) => {
                const values = watched?.[index];
                const quantities = lineQuantities(line.outstandingQty, values?.receivedQty ?? "", values?.rejectedQty ?? "");
                return (
                  <tr key={line.purchaseOrderLineId} className="border-b align-top last:border-0">
                    <Td className="pl-4 tabular-nums">{index + 1}</Td>
                    <Td className="font-mono">{header.poNumber}</Td>
                    <Td>
                      <LineInput control={control} name={`lines.${index}.itemCode`} label={`Item code, line ${index + 1}`} />
                    </Td>
                    <Td className="whitespace-normal">{line.description}</Td>
                    <Td>
                      <Controller
                        control={control}
                        name={`lines.${index}.departmentId`}
                        render={({ field }) => (
                          <NativeSelect {...field} aria-label={`Dept, line ${index + 1}`} className="w-full">
                            {departments.map((option) => (
                              <NativeSelectOption key={option.value} value={option.value}>
                                {option.label}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        )}
                      />
                    </Td>
                    <Td>{line.unit}</Td>
                    <Td className="text-right tabular-nums">{formatQuantity(line.orderedQty)}</Td>
                    <Td className="text-right tabular-nums text-muted-foreground">{formatQuantity(line.outstandingQty)}</Td>
                    <Td>
                      <LineInput control={control} name={`lines.${index}.receivedQty`} label={`Received, line ${index + 1}`} numeric />
                    </Td>
                    <Computed value={quantities.short} warn />
                    <Computed value={quantities.excess} warn />
                    <Td>
                      <LineInput control={control} name={`lines.${index}.rejectedQty`} label={`Rejected, line ${index + 1}`} numeric />
                    </Td>
                    <Computed value={quantities.accepted} className="pr-4 font-medium" />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {linesError?.message && (
          <p role="alert" className="px-4 py-3 text-sm text-destructive">
            {linesError.message}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remarks</CardTitle>
        </CardHeader>
        <CardContent>
          <TextField control={control} name="remarks" label="Remarks" multiline />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Saving…" : "Save GRN"}
        </Button>
      </div>
    </form>
  );
}

function Th({ className, children }: { className?: string; children: React.ReactNode }) {
  return <th className={`px-2 py-2 font-medium ${className ?? ""}`}>{children}</th>;
}

function Td({ className, children }: { className?: string; children: React.ReactNode }) {
  return <td className={`px-2 py-2 ${className ?? ""}`}>{children}</td>;
}

function Computed({ value, warn, className }: { value: string; warn?: boolean; className?: string }) {
  const nonZero = Number(value) > 0;
  return (
    <Td className={`text-right tabular-nums ${warn && nonZero ? "text-amber-700 dark:text-amber-400" : ""} ${!nonZero ? "text-muted-foreground" : ""} ${className ?? ""}`}>
      {formatQuantity(value)}
    </Td>
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

function LineInput({
  control,
  name,
  label,
  numeric,
}: {
  control: Control<GrnInput>;
  name: `lines.${number}.itemCode` | `lines.${number}.receivedQty` | `lines.${number}.rejectedQty`;
  label: string;
  numeric?: boolean;
}) {
  const { errors } = useFormState({ control, name });
  const [, index, key] = name.split(".") as [string, string, "itemCode" | "receivedQty" | "rejectedQty"];
  const error = errors.lines?.[Number(index)]?.[key];
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-1">
          <Input
            {...field}
            aria-label={label}
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
