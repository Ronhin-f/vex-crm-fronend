import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }) {
  const getTheme = () =>
    document.documentElement.getAttribute("data-theme") || "vexcrm";
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("vex_theme", theme); } catch {}
  }, [theme]);

  const next = theme === "vexcrm" ? "vexcrm-dark" : "vexcrm";
  const Icon = theme === "vexcrm" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={className || "btn btn-ghost btn-sm"}
      title={`Cambiar a ${next === "vexcrm" ? "light" : "dark"}`}
    >
      <Icon size={16} />
      <span className="hidden sm:inline ml-1">
        {theme === "vexcrm" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
