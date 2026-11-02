"use client";

import { useTheme } from "@/components/theme/theme";
import { THEME_OPTIONS } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

/** Light / Dark / System choice as large buttons, for the Profile page. */
export function ThemeSelector() {
  const { preference, setTheme } = useTheme();

  return (
    <div role="radiogroup" aria-label="Theme" className="grid gap-2 sm:grid-cols-3">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={preference === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
            preference === value && "border-primary bg-primary/5 font-medium",
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
