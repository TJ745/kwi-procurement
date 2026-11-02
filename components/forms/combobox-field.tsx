"use client";

import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronsUpDown, XIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type ComboboxFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: Option[];
  placeholder?: string;
  emptyText?: string;
  description?: string;
  required?: boolean;
  /** Called after the user picks an option ("" when cleared). */
  onSelect?: (value: string) => void;
};

/** Searchable single-select whose form value is the option's `value` ("" when empty). */
export function ComboboxField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Search…",
  emptyText = "No matches.",
  description,
  required,
  onSelect,
}: ComboboxFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
        const selected = options.find((option) => option.value === field.value) ?? null;
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
            <Combobox.Root
              items={options}
              value={selected}
              onValueChange={(option: Option | null) => {
                field.onChange(option?.value ?? "");
                onSelect?.(option?.value ?? "");
              }}
              itemToStringLabel={(option: Option) => option.label}
              isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
              autoHighlight
            >
              <div className="relative">
                <Combobox.Input
                  id={id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  placeholder={placeholder}
                  aria-invalid={fieldState.invalid}
                  aria-required={required}
                  className={cn(
                    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pr-14 pl-2.5 text-sm transition-colors outline-none placeholder:text-muted-foreground",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
                  )}
                />
                <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
                  {!required && selected && (
                    <Combobox.Clear
                      aria-label={`Clear ${label}`}
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <XIcon className="size-3.5" />
                    </Combobox.Clear>
                  )}
                  <Combobox.Trigger
                    aria-label={`Show ${label} options`}
                    className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronsUpDown className="size-3.5" />
                  </Combobox.Trigger>
                </div>
              </div>
              <Combobox.Portal>
                <Combobox.Positioner className="isolate z-50 outline-none" sideOffset={4}>
                  <Combobox.Popup className="max-h-[min(var(--available-height),20rem)] w-(--anchor-width) min-w-48 overflow-y-auto rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none">
                    <Combobox.Empty className="px-2 py-1.5 text-muted-foreground empty:hidden">
                      {emptyText}
                    </Combobox.Empty>
                    <Combobox.List>
                      {(option: Option) => (
                        <Combobox.Item
                          key={option.value}
                          value={option}
                          className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                        >
                          <span className="flex-1 truncate">{option.label}</span>
                          <Combobox.ItemIndicator>
                            <CheckIcon className="size-4" />
                          </Combobox.ItemIndicator>
                        </Combobox.Item>
                      )}
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
