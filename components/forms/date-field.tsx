"use client";

import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  /** date-fns pattern from Settings, e.g. "d MMM yyyy". */
  displayFormat: string;
  required?: boolean;
};

const ISO = "yyyy-MM-dd";

/** Calendar picker whose form value is a calendar date string (yyyy-MM-dd). */
export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  displayFormat,
  required,
}: DateFieldProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
        const selected = field.value ? parse(field.value, ISO, new Date()) : undefined;
        const valid = selected && !Number.isNaN(selected.getTime()) ? selected : undefined;
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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id={id}
                    ref={field.ref}
                    type="button"
                    variant="outline"
                    aria-invalid={fieldState.invalid}
                    className={cn("w-full justify-start font-normal", !valid && "text-muted-foreground")}
                  />
                }
              >
                <CalendarIcon />
                {valid ? format(valid, displayFormat) : "Select a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={valid}
                  defaultMonth={valid}
                  captionLayout="dropdown"
                  startMonth={new Date(2000, 0)}
                  endMonth={new Date(new Date().getFullYear() + 5, 11)}
                  onSelect={(date) => {
                    if (!date) return;
                    field.onChange(format(date, ISO));
                    field.onBlur();
                    setOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
