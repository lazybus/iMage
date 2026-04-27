"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "image-theme";
const THEME_CHANGED_EVENT = "image:theme-changed";

function syncTheme(theme: "dark" | "light") {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.body.dataset.theme = theme;
}

function applyTheme(theme: "dark" | "light") {
  syncTheme(theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_CHANGED_EVENT));
}

function readThemeSnapshot() {
  if (typeof window === "undefined") {
    return "dark" satisfies "dark" | "light";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribeToTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEY) {
      return;
    }

    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGED_EVENT, onStoreChange);
  };
}

function LightbulbIcon({ theme }: { theme: "dark" | "light" }) {
  const stroke = theme === "dark" ? "currentColor" : "#14532d";
  const fill = theme === "dark" ? "rgba(142, 208, 163, 0.2)" : "rgba(20, 83, 45, 0.14)";

  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M9 18h6M9.8 21h4.4M8.4 14.8c-.9-.9-1.4-2.1-1.4-3.5a5 5 0 0 1 10 0c0 1.4-.5 2.6-1.4 3.5-.8.8-1.2 1.5-1.4 2.2h-4.4c-.2-.7-.6-1.4-1.4-2.2Z"
        fill={fill}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M12 2.5v2.3M4.9 5.6l1.6 1.6M19.1 5.6l-1.6 1.6M3 11.5h2.3M18.7 11.5H21" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, readThemeSnapshot, () => "dark");

  useEffect(() => {
    syncTheme(theme);
  }, [theme]);

  function handleToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  }

  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="theme-toggle"
      onClick={handleToggle}
      type="button"
    >
      <LightbulbIcon theme={theme} />
      <span className="theme-toggle-label">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}