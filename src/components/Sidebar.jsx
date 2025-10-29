// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Users,
  FileText,
  LogOut,
  KanbanSquare,
  ListTodo,
  Building2,
  Receipt,          // icono para Facturación
} from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageToggle from "./LanguageToggle.jsx";
import { useTranslation } from "react-i18next";

const linkBase =
  "rounded-xl px-3 py-2.5 flex items-center gap-2 text-sm transition border border-transparent";
const linkActive = "bg-base-200 text-primary border-base-300";
const linkHover = "hover:bg-base-100/60";

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
        className="p-5 border-b border-base-200 flex items-center gap-3 cursor-pointer select-none"
        onClick={() => {
          onNavigate();
          navigate("/");
        }}
        title={t("app.brand", "Vex CRM")}
      >
        <img src="/logo-vex-crm.png" alt="Vex CRM" className="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold leading-5 truncate">
            {t("app.brand", "Vex CRM")}
          </div>
          <div className="text-xs text-base-content/60 truncate">
            {usuario?.email}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="px-4 py-4 flex-1 overflow-y-auto">
        <ul className="menu gap-2">
          <li className="menu-title px-1 uppercase tracking-wide text-xs text-base-content/60">
            {t("nav.section.main", "Principal")}
          </li>
          <li className="mx-1">
            <NavLink to="/" end onClick={onNavigate} className={linkClass}>
              <Home size={18} /> {t("nav.dashboard", "Dashboard")}
            </NavLink>
          </li>

          <li className="menu-title px-1 mt-2 uppercase tracking-wide text-xs text-base-content/60">
            {t("nav.section.crm", "CRM")}
          </li>
          <li className="mx-1">
            <NavLink to="/clientes" onClick={onNavigate} className={linkClass}>
              <Users size={18} /> {t("nav.clients", "Clientes")}
            </NavLink>
          </li>

          {/* Proyectos (pipeline basado en oportunidades) */}
          <li className="mx-1">
            <NavLink to="/pipeline" onClick={onNavigate} className={linkClass}>
              <KanbanSquare size={18} /> {t("nav.projects", "Proyectos")}
            </NavLink>
          </li>

          {/* Subcontratistas */}
          <li className="mx-1">
            <NavLink to="/proveedores" onClick={onNavigate} className={linkClass}>
              <Building2 size={18} /> {t("nav.providers", "Subcontratistas")}
            </NavLink>
          </li>

          <li className="menu-title px-1 mt-2 uppercase tracking-wide text-xs text-base-content/60">
            {t("nav.section.ops", "Operaciones")}
          </li>

          {/* Facturación */}
          <li className="mx-1">
            <NavLink to="/facturacion" onClick={onNavigate} className={linkClass}>
              <Receipt size={18} /> {t("nav.billing", "Facturación")}
            </NavLink>
          </li>

          <li className="mx-1">
            <NavLink to="/tareas" onClick={onNavigate} className={linkClass}>
              <FileText size={18} /> {t("nav.tasks", "Tareas")}
            </NavLink>
          </li>

          {/* Kanban de tareas */}
          <li className="mx-1">
            <NavLink
              to="/kanban-tareas"
              onClick={onNavigate}
              className={linkClass}
            >
              <ListTodo size={18} /> {t("nav.kanbanTasks", "Kanban de tareas")}
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Footer del sidebar */}
      <div className="mt-auto bg-base-100 border-t border-base-200 p-4">
        <div className="grid grid-cols-3 gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={() => {
              logout();
              onNavigate();
              navigate("/");
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
