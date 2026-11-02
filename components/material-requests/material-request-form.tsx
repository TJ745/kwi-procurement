"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Control, Controller, useFieldArray, useFormState } from "react-hook-form";

import { ComboboxField } from "@/components/forms/combobox-field";
import { DateField } from "@/components/forms/date-field";
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
import {
  EMPTY_LINE,
  MAX_LINES,
  type MaterialRequestInput,
  materialRequestSchema,
} from "@/lib/validation/material-request";

type Option = { value: string; label: string };

type MaterialRequestFormProps = {
  action: (input: MaterialRequestInput) => Promise<ActionResult>;
  defaultValues: MaterialRequestInput;
  options: {
    projects: Option[];
    departments: Option[];
    categories: Option[];
    suppliers: Option[];
  };
  /** Existing number when editing; new requests are numbered on save. */
  number?: string;
  /** Preview of the next number, shown for new requests. */
  nextNumberPreview?: string;
  cancelHref: string;
  /** date-fns pattern from Settings, for the date picker. */
  dateFormat: string;
};

const LINE_COLUMNS = "md:grid-cols-[2.5rem_minmax(0,2fr)_7rem_7rem_minmax(0,1.5fr)_2.25rem]";

export function MaterialRequestForm({
  action,
  defaultValues,
  options,
  number,
  nextNumberPreview,
  cancelHref,
  dateFormat,
}: MaterialRequestFormProps) {
  const router = useRouter();
  const { form, onSubmit } = useActionForm({
    schema: materialRequestSchema,
    defaultValues,
    action,
    onSuccess: (result) => {
      router.push(result.id ? `/material-requests/${result.id}` : "/material-requests");
    },
  });
  const { control } = form;
  const lines = useFieldArray({ control, name: "lines" });
  const isSubmitting = form.formState.isSubmitting;
  const linesError = form.formState.errors.lines?.root ?? form.formState.errors.lines;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel>Request No</FieldLabel>
              <div className="flex h-8 items-center rounded-lg border border-dashed bg-muted/40 px-2.5 text-sm">
                {number ? (
                  <span className="font-mono font-medium">{number}</span>
                ) : (
                  <span className="text-muted-foreground">
                    Assigned on save{nextNumberPreview ? ` (next: ${nextNumberPreview})` : ""}
                  </span>
                )}
              </div>
            </Field>
            <DateField control={control} name="requestDate" label="Request date" displayFormat={dateFormat} required />
            <ComboboxField control={control} name="projectId" label="Project" options={options.projects} placeholder="Search projects" required />
            <ComboboxField control={control} name="departmentId" label="Requested by (Department)" options={options.departments} placeholder="Search departments" required />
            <ComboboxField control={control} name="categoryId" label="Category" options={options.categories} placeholder="Search categories" required />
            <ComboboxField control={control} name="supplierId" label="Supplier" options={options.suppliers} placeholder="Optional" />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {lines.fields.length} of up to {MAX_LINES} lines. Quantities allow 2 decimals (e.g. 2.55).
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={lines.fields.length >= MAX_LINES}
              onClick={() => lines.append({ ...EMPTY_LINE }, { focusName: `lines.${lines.fields.length}.name` })}
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
            <span>Remarks</span>
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
                <RemoveLineButton
                  className="md:hidden"
                  index={index}
                  disabled={lines.fields.length === 1}
                  onRemove={() => lines.remove(index)}
                />
              </div>
              <LineInput control={control} index={index} field="name" label="Name" className="col-span-2 md:col-span-1" />
              <LineInput control={control} index={index} field="unit" label="Unit" />
              <LineInput control={control} index={index} field="quantity" label="Quantity" inputMode="decimal" />
              <LineInput control={control} index={index} field="remarks" label="Remarks" className="col-span-2 md:col-span-1" />
              <RemoveLineButton
                className="hidden md:flex"
                index={index}
                disabled={lines.fields.length === 1}
                onRemove={() => lines.remove(index)}
              />
            </div>
          ))}
          {linesError?.message && (
            <p role="alert" className="text-sm text-destructive">
              {linesError.message}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Saving…" : "Save request"}
        </Button>
      </div>
    </form>
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
  inputMode,
}: {
  control: Control<MaterialRequestInput>;
  index: number;
  field: "name" | "unit" | "quantity" | "remarks";
  label: string;
  className?: string;
  inputMode?: "decimal";
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
            inputMode={inputMode}
            autoComplete="off"
            aria-invalid={Boolean(error)}
            className={inputMode ? "text-right tabular-nums" : undefined}
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
