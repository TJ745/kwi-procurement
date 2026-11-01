"use client";

import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

type SwitchFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function SwitchField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: SwitchFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const id = `field-${name}`;
        return (
          <Field orientation="horizontal" data-disabled={disabled}>
            <FieldContent>
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
              {description && <FieldDescription>{description}</FieldDescription>}
            </FieldContent>
            <Switch
              id={id}
              checked={Boolean(field.value)}
              onCheckedChange={(checked) => field.onChange(checked)}
              onBlur={field.onBlur}
              disabled={disabled}
            />
          </Field>
        );
      }}
    />
  );
}
