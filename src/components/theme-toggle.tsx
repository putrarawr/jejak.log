"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as "light" | "dark") ||
      (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("jejak-theme", next);
    } catch {}
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Ganti tema"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-mono-600 dark:text-mono-400 transition-colors duration-200 hover:bg-mono-200/50 dark:hover:bg-mono-800/50 hover:text-mono-900 dark:hover:text-mono-100 active:scale-95 border border-mono-200 dark:border-mono-800"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export default ThemeToggle;
