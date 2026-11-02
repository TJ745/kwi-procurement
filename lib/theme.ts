export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";
export const DEFAULT_THEME: ThemePreference = "light";
export const DARK_QUERY = "(prefers-color-scheme: dark)";
