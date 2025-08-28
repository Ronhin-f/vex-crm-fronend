// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Users,
  ClipboardList,
  FileText,
  LogOut,
  KanbanSquare,
  ListTodo,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageToggle from "./LanguageToggle.jsx";
import { useTranslation } from "react-i18next";

const linkBase = "rounded-lg px-3 py-2 flex items-center gap-2 transition";
const linkActive = "bg-base-200 text-primary";
const linkHover = "hover:bg-base-100";

/** onNavigate se usa para cerrar el drawer en mobile */
export default function Sidebar({ onNavigate = () => {} }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const linkClass = ({ isActive }) =>
    `${linkBase} ${isActive ? linkActive : linkHover}`;

  return (
    <aside className="w-64 bg-base-100 border-r border-base-200 h-screen flex flex-col">
      {/* Brand */}
      <div
        className="p-4 border-b border-base-200 flex items-center gap-3 cursor-pointer select-none"
        onClick={() => {
          onNavigate();
          navigate("/");
        }}
        title={t("app.brand", "Vex CRM")}
      >
        {/* Usa /public/logo-vex-crm.png o import desde assets */}
        <img src="/logo-vex-crm.png" alt="Vex CRM" className="w-10 h-10" />
        <div className="flex-1">
          <div className="font-semibold leading-5">{t("app.brand", "Vex CRM")}</div>
          <div className="text-xs text-base-content/60 truncate">
            {usuario?.email}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="p-3 flex-1 overflow-y-auto">
        <ul className="menu gap-1">
          <li>
            <NavLink to="/" end onClick={onNavigate} className={linkClass}>
              <Home size={18} /> {t("nav.dashboard", "Dashboard")}
            </NavLink>
          </li>

          <li>
            <NavLink to="/clientes" onClick={onNavigate} className={linkClass}>
              <Users size={18} /> {t("nav.clients", "Clientes")}
            </NavLink>
          </li>

          {/* Pipeline (Kanban de clientes) */}
          <li>
            <NavLink to="/pipeline" onClick={onNavigate} className={linkClass}>
              <KanbanSquare size={18} /> {t("nav.pipeline", "Pipeline")}
            </NavLink>
          </li>

          <li>
            <NavLink to="/compras" onClick={onNavigate} className={linkClass}>
              <ClipboardList size={18} /> {t("nav.orders", "Compras")}
            </NavLink>
          </li>

          <li>
            <NavLink to="/tareas" onClick={onNavigate} className={linkClass}>
              <FileText size={18} /> {t("nav.tasks", "Tareas")}
            </NavLink>
          </li>

          {/* Kanban de tareas */}
          <li>
            <NavLink to="/kanban-tareas" onClick={onNavigate} className={linkClass}>
              <ListTodo size={18} /> {t("nav.kanbanTasks", "Kanban tareas")}
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Footer del sidebar */}
      <div className="mt-auto bg-base-100 border-t border-base-200 p-3">
        <div className="grid grid-cols-3 gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={() => {
              logout();       // limpia token/estado
              onNavigate();   // cierra drawer en mobile
              navigate("/");  // ruta protegida → RutaPrivada decide (redirige / bloquea)
            }}
            className="btn btn-ghost btn-sm text-error w-full justify-center"
            title={t("actions.logout", "Salir")}
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{t("actions.logout", "Salir")}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
