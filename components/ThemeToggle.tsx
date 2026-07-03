"use client";

import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

function applyMode(mode: Mode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", resolvedDark);
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "system";
    setMode(stored);
    setMounted(true);

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "system";
      if (current === "system") applyMode("system");
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  function pick(next: Mode) {
    setMode(next);
    if (next === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
    applyMode(next);
  }

  const options: { value: Mode; label: string; icon: React.ReactNode }[] = [
    {
      value: "light",
      label: "라이트",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ),
    },
    {
      value: "system",
      label: "시스템",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      ),
    },
    {
      value: "dark",
      label: "다크",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white/80 p-0.5 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80"
      role="group"
      aria-label="테마 전환"
    >
      {options.map((opt) => {
        const active = mounted && mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => pick(opt.value)}
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
            className={
              active
                ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-pink-600 text-white shadow-sm transition"
                : "inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            }
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
