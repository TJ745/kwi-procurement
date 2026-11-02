"use client";

import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** Exactly-one choice shown as a row of toggle buttons (radio group). */
export function ChoiceField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required = true,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: readonly { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>
            {label}
            {required && (
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            )}
          </FieldLabel>
          <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
            {options.map((option) => {
              const selected = field.value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => field.onChange(option.value)}
                  onBlur={field.onBlur}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected && "border-primary bg-primary/10 font-medium",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {fieldState.error && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
