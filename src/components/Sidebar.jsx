// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Users, ClipboardList, FileText, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageToggle from "./LanguageToggle.jsx";
import { useTranslation } from "react-i18next";

const linkBase = "rounded-lg px-3 py-2 flex items-center gap-2 transition";
const linkActive = "bg-base-200 text-primary";
const linkHover = "hover:bg-base-100";

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <aside className="w-64 bg-base-100 border-r border-base-200 h-screen flex flex-col sticky top-0">
      {/* Brand */}
      <div className="p-4 border-b border-base-200 flex items-center gap-3">
        <img src="/logo-vex-crm.png" alt="Vex" className="w-10 h-10" />
        <div className="flex-1">
          <div className="font-semibold leading-5">{t("app.brand")}</div>
          <div className="text-xs text-base-content/60 truncate">{usuario?.email}</div>
        </div>
      </div>

      {/* Nav */}
      <div className="p-3 flex-1 overflow-y-auto">
        <ul className="menu gap-1">
          <li>
            <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkHover}`}>
              <Home size={18} /> {t("nav.dashboard")}
            </NavLink>
          </li>
          <li>
            <NavLink to="/clientes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkHover}`}>
              <Users size={18} /> {t("nav.clients")}
            </NavLink>
          </li>
          <li>
            <NavLink to="/compras" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkHover}`}>
              <ClipboardList size={18} /> {t("nav.orders")}
            </NavLink>
          </li>
          <li>
            <NavLink to="/tareas" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkHover}`}>
              <FileText size={18} /> {t("nav.tasks")}
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Footer fijo adentro */}
      <div className="mt-auto sticky bottom-0 bg-base-100 border-t border-base-200 p-3">
        <div className="grid grid-cols-3 gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="btn btn-ghost btn-sm text-error w-full justify-center"
            title={t("actions.logout")}
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{t("actions.logout")}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
