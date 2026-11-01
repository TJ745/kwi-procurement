"use client";

import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  required?: boolean;
  multiline?: boolean;
} & Pick<
  React.ComponentProps<"input">,
  "type" | "autoComplete" | "autoFocus" | "inputMode" | "placeholder"
>;

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  multiline,
  ...inputProps
}: TextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
        const shared = {
          ...field,
          id,
          "aria-invalid": fieldState.invalid,
          "aria-required": required,
        };
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>
              {label}
              {required && (
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              )}
            </FieldLabel>
            {multiline ? (
              <Textarea {...shared} rows={3} />
            ) : (
              <Input {...shared} {...inputProps} />
            )}
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
