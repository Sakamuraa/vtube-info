/**
 * Theme: light or dark, following the system until the visitor chooses.
 *
 * The choice is read before first paint by a tiny inline script in index.html, so
 * a dark-mode visitor never eats a light flash. This hook only owns the toggle
 * and keeps the two in sync -- the storage key here and the one in index.html
 * must stay the same string, or the choice is written under one name and read
 * under another and the toggle dies silently.
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "vtube-theme";

type Theme = "light" | "dark";

function read(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private mode, or storage blocked. Fall through to the system preference.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "light" : read(),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Nothing to do: the theme still applies for this visit, it just will not
      // be remembered.
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return [theme, toggle];
}