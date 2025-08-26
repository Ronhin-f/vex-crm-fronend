import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Users, ClipboardList, FileText, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";

const linkBase = "rounded-lg px-3 py-2 flex items-center gap-2 transition";
const linkActive = "bg-base-200 text-primary";
const linkHover = "hover:bg-base-100";

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-base-100 border-r border-base-200 min-h-screen flex flex-col sticky top-0">
      <div className="p-4 border-b border-base-200 flex items-center gap-3">
        <img src="/logo-vex.svg" alt="Vex" className="w-10 h-10" />
        <div className="flex-1">
          <div className="font-semibold leading-5">Vex CRM</div>
          <div className="text-xs text-base-content/60 truncate">{usuario?.email}</div>
        </div>
      </div>

      <div className="p-3 flex-1">
        <ul className="menu gap-1">
          <li>
            <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkHover}`}>
              <Home size={18} /> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/clientes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkHover}`}>
              <Users size={18} /> Clientes
            </NavLink>
          </li>
          <li>
            <NavLink to="/compras" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkHover}`}>
              <ClipboardList size={18} /> Pedidos
            </NavLink>
          </li>
          <li>
            <NavLink to="/tareas" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkHover}`}>
              <FileText size={18} /> Tareas
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="p-3 border-t border-base-200 flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="btn btn-ghost btn-sm text-error w-full justify-center"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </aside>
  );
}
