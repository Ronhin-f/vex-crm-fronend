// src/components/Sidebar.jsx
import React from "react";
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
  Receipt,
  Sliders,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageToggle from "./LanguageToggle.jsx";
import PerfilModal from "./perfil/PerfilModal";
import { usePerfilUsuario } from "../hooks/usePerfilUsuario";
import { useTranslation } from "react-i18next";
import { useArea } from "../context/AreaContext";

const linkBase =
  "rounded-xl px-3 py-2.5 flex items-center gap-2 text-sm transition border border-transparent";
const linkActive = "bg-base-200 text-primary border-base-300";
const linkHover = "hover:bg-base-100/60";

export default function Sidebar({ onNavigate = () => {} }) {
  const { usuario, logout } = useAuth();
  const { perfil } = usePerfilUsuario();
  const [openPerfil, setOpenPerfil] = React.useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { vocab } = useArea();

  const linkClass = ({ isActive }) =>
    `${linkBase} ${isActive ? linkActive : linkHover}`;

  const labels = {
    dashboard: t("nav.dashboard", "Dashboard"),
    clients: vocab?.clients || t("nav.clients", "Clientes"),
    projects: vocab?.projects || t("nav.projects", "Proyectos"),
    providers: vocab?.providers || t("nav.providers", "Subcontratistas"),
    tasks: vocab?.tasks || t("nav.tasks", "Tareas"),
    billing: vocab?.billing || t("nav.billing", "Facturacion"),
    kanbanTasks: t("nav.kanbanTasks", "Kanban de tareas"),
  };

  const displayName =
    perfil?.nombre_completo ||
    perfil?.nombre ||
    usuario?.nombre ||
    usuario?.email?.split("@")?.[0] ||
    usuario?.email ||
    "Usuario";

  return (
    <aside className="w-64 bg-base-100 border-r border-base-200 h-screen flex flex-col">
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
            {displayName}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex-1 overflow-y-auto">
        <ul className="menu gap-2">
          <li className="menu-title px-1 uppercase tracking-wide text-xs text-base-content/60">
            {t("nav.section.main", "Principal")}
          </li>
          <li className="mx-1">
            <NavLink to="/" end onClick={onNavigate} className={linkClass}>
              <Home size={18} /> {labels.dashboard}
            </NavLink>
          </li>

          <li className="menu-title px-1 mt-2 uppercase tracking-wide text-xs text-base-content/60">
            {t("nav.section.crm", "CRM")}
          </li>
          <li className="mx-1">
            <NavLink to="/clientes" onClick={onNavigate} className={linkClass}>
              <Users size={18} /> {labels.clients}
            </NavLink>
          </li>

          <li className="mx-1">
            <NavLink to="/pipeline" onClick={onNavigate} className={linkClass}>
              <KanbanSquare size={18} /> {labels.projects}
            </NavLink>
          </li>

          <li className="mx-1">
            <NavLink to="/proveedores" onClick={onNavigate} className={linkClass}>
              <Building2 size={18} /> {labels.providers}
            </NavLink>
          </li>

          <li className="menu-title px-1 mt-2 uppercase tracking-wide text-xs text-base-content/60">
            {t("nav.section.ops", "Operaciones")}
          </li>

          <li className="mx-1">
            <NavLink to="/facturacion" onClick={onNavigate} className={linkClass}>
              <Receipt size={18} /> {labels.billing}
            </NavLink>
          </li>

          <li className="mx-1">
            <NavLink to="/tareas" onClick={onNavigate} className={linkClass}>
              <FileText size={18} /> {labels.tasks}
            </NavLink>
          </li>

          <li className="mx-1">
            <NavLink
              to="/kanban-tareas"
              onClick={onNavigate}
              className={linkClass}
            >
              <ListTodo size={18} /> {labels.kanbanTasks}
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="mt-auto bg-base-100 border-t border-base-200 p-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => setOpenPerfil(true)}
            className="btn btn-outline btn-sm w-full justify-center gap-2 whitespace-nowrap"
            title="Ver mi perfil"
          >
            Perfil
          </button>
          <LanguageToggle />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-2 gap-2">
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
          <div aria-hidden />
        </div>
      </div>
      <PerfilModal open={openPerfil} onClose={() => setOpenPerfil(false)} />
    </aside>
  );
}
