"use client";

import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// No look-alike characters (0/O, 1/l/I) so it can be read out or copied by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*?";

function generatePassword(length: number) {
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (value) => ALPHABET[value % ALPHABET.length]).join("");
}

type PasswordFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  autoComplete: "new-password" | "current-password";
  /** Shows a button that fills in a random password of this length. */
  generateLength?: number;
};

export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  autoComplete,
  generateLength,
}: PasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  {...field}
                  id={id}
                  type={visible ? "text" : "password"}
                  autoComplete={autoComplete}
                  aria-invalid={fieldState.invalid}
                  className="pr-9 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-1.5 -translate-y-1/2"
                  onClick={() => setVisible((value) => !value)}
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {generateLength && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    field.onChange(generatePassword(generateLength));
                    setVisible(true);
                  }}
                >
                  <RefreshCw />
                  Generate
                </Button>
              )}
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
