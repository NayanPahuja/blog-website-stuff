"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

function resolveTheme(preference: Theme): "light" | "dark" {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(preference: Theme) {
  const theme = resolveTheme(preference);
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-theme-preference", preference);
}

function createThemeStore() {
  let current: Theme = "system";
  const listeners = new Set<() => void>();

  function getSnapshot() {
    return current;
  }

  function getServerSnapshot() {
    return "system";
  }

  function subscribe(callback: () => void) {
    listeners.add(callback);
    if (current === "system" && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored === "light" || stored === "dark" || stored === "system") {
          current = stored;
          listeners.forEach((cb) => cb());
        }
      } catch {}
    }
    return () => listeners.delete(callback);
  }

  function set(value: Theme) {
    if (value === current) return;
    current = value;
    try {
      localStorage.setItem("theme", value);
    } catch {}
    applyTheme(value);
    listeners.forEach((cb) => cb());
  }

  return { getSnapshot, getServerSnapshot, subscribe, set };
}

const store = createThemeStore();

const themes: { value: Theme; label: string; title: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    title: "Use light theme",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
  },
  {
    value: "system",
    label: "System",
    title: "Use system theme",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 16v4" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    title: "Use dark theme",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.985 12.486A9 9 0 1 1 11.514 3.015a7 7 0 0 0 9.471 9.471Z" />
      </svg>
    ),
  },
];

export function ThemeToggle() {
  const preference = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const p = (document.documentElement.getAttribute("data-theme-preference") as Theme) || "system";
      if (p === "system") applyTheme("system");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const select = useCallback((value: Theme) => {
    store.set(value);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      const keys = ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Home", "End"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      let nextIndex = currentIndex;
      if (e.key === "Home") nextIndex = 0;
      else if (e.key === "End") nextIndex = themes.length - 1;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        nextIndex = (currentIndex - 1 + themes.length) % themes.length;
      else nextIndex = (currentIndex + 1) % themes.length;
      select(themes[nextIndex].value);
    },
    [select],
  );

  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Theme">
      {themes.map((t, i) => (
        <button
          key={t.value}
          className="theme-toggle"
          type="button"
          role="radio"
          aria-checked={preference === t.value}
          tabIndex={preference === t.value ? 0 : -1}
          title={t.title}
          aria-label={t.title}
          onClick={() => select(t.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
