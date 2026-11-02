"use client";

import { useSyncExternalStore } from "react";

import {
  DARK_QUERY,
  DEFAULT_THEME as DEFAULT,
  THEME_STORAGE_KEY as STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme";

/**
 * Light / dark / system theme, stored per browser in localStorage.
 * `ThemeScript` (theme-script.tsx) applies it before first paint so there is
 * no flash; this hook keeps components in sync when it changes (also across
 * tabs).
 */

const CHANGE_EVENT = "themechange";

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function apply(preference: ThemePreference) {
  const dark =
    preference === "dark" || (preference === "system" && matchMedia(DARK_QUERY).matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const media = matchMedia(DARK_QUERY);
  const handler = () => {
    apply(readPreference());
    onChange();
  };
  media.addEventListener("change", handler);
  window.addEventListener("storage", handler);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    media.removeEventListener("change", handler);
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => DEFAULT);
  const resolved = useSyncExternalStore<"light" | "dark">(
    subscribe,
    () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "light",
  );

  function setTheme(next: ThemePreference) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode): still apply for this page view.
    }
    apply(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return { preference, resolved, setTheme };
}

