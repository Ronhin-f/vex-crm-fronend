// src/components/LanguageToggle.jsx
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LanguageToggle({ className = "" }) {
  const { i18n, t } = useTranslation();
  const lang = (i18n.language || "es").startsWith("en") ? "en" : "es";
  const next = lang === "es" ? "en" : "es";

  function change() {
    i18n.changeLanguage(next);
    try { localStorage.setItem("vex_lang", next); } catch {}
  }

  return (
    <button
      type="button"
      onClick={change}
      className={className || "btn btn-ghost btn-sm"}
      title={t("actions.changeLanguage")}
    >
      <Languages size={16} />
      <span className="hidden sm:inline ml-1">{next.toUpperCase()}</span>
    </button>
  );
}
