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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type SelectFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  description?: string;
  required?: boolean;
};

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  description,
  required,
}: SelectFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
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
            <NativeSelect
              {...field}
              id={id}
              aria-invalid={fieldState.invalid}
              aria-required={required}
              className="w-full"
            >
              {placeholder && (
                <NativeSelectOption value="" disabled>
                  {placeholder}
                </NativeSelectOption>
              )}
              {options.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
