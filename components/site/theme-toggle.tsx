"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Mode = "light" | "dark" | "system";

const STORAGE_KEY = "medivyx:theme";
const DARK = "dark";

/** Apply a mode to <html> and persist the choice. */
function apply(mode: Mode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && prefersDark);
  document.documentElement.classList.toggle(DARK, dark);
  localStorage.setItem(STORAGE_KEY, mode);
}

/**
 * Lightweight theme toggle (no dependency): light / dark / system.
 * The blocking script in layout.tsx sets the class before paint (no FOUC);
 * this control just reflects and flips the stored preference.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const read = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      setMode(
        stored === "light" || stored === "dark" ? stored : "system",
      );
      setMounted(true);
    };
    read();
  }, []);

  const next = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        apply(next);
        setMode(next);
      }}
      aria-label={
        mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      aria-pressed={mounted && mode === "dark"}
      className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
    >
      <Sun
        aria-hidden="true"
        className={`size-5 transition-transform duration-300 ${
          mounted && mode === "dark"
            ? "scale-100 rotate-0"
            : "scale-0 -rotate-90 absolute"
        }`}
      />
      <Moon
        aria-hidden="true"
        className={`size-5 transition-transform duration-300 ${
          mounted && mode === "dark"
            ? "scale-0 rotate-90 absolute"
            : "scale-100 rotate-0"
        }`}
      />
    </button>
  );
}
