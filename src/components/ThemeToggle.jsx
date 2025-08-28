// src/components/ThemeToggle.jsx
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const LIGHT = "vexcrm";
const DARK = "vexcrm-dark";
const STORAGE_KEY = "vex_theme";

function readInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch {}
  if (typeof document !== "undefined") {
    const current = document.documentElement.getAttribute("data-theme");
    if (current) return current;
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK : LIGHT;
  }
  return LIGHT;
}

export default function ThemeToggle({ className = "btn btn-ghost btn-sm" }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const isDark = theme === DARK;
  const Icon = isDark ? Sun : Moon;
  const next = isDark ? LIGHT : DARK;

  const toggle = () => setTheme(next);
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      onKeyDown={onKeyDown}
      className={className}
      role="switch"
      aria-checked={isDark}
      aria-label={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
      title={`Cambiar a ${next === LIGHT ? "light" : "dark"}`}
    >
      <Icon size={16} />
      <span className="hidden sm:inline ml-1">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
