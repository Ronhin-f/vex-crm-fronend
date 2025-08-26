// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Users, ClipboardList, FileText, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx"; // ✅ relativo + extensión + casing

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-56 bg-white shadow-xl flex flex-col min-h-screen">
      <div className="p-4 border-b flex flex-col items-center">
        <img src="/logo-vex.svg" alt="Vex" className="w-20 mb-2" />
        <div className="text-xs text-gray-500 mb-2 text-center break-words">
          {usuario?.email}
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium transition ${
              isActive ? "bg-base-200 text-primary" : "hover:bg-base-100"
            }`
          }
        >
          <Home size={18} /> Dashboard
        </NavLink>
        <NavLink
          to="/clientes"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium transition ${
              isActive ? "bg-base-200 text-primary" : "hover:bg-base-100"
            }`
          }
        >
          <Users size={18} /> Clientes
        </NavLink>
        <NavLink
          to="/pedidos"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium transition ${
              isActive ? "bg-base-200 text-primary" : "hover:bg-base-100"
            }`
          }
        >
          <ClipboardList size={18} /> Pedidos
        </NavLink>
        <NavLink
          to="/tareas"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium transition ${
              isActive ? "bg-base-200 text-primary" : "hover:bg-base-100"
            }`
          }
        >
          <FileText size={18} /> Tareas
        </NavLink>
      </nav>

      <div className="m-4 flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-error hover:bg-base-100 transition"
        >
          <LogOut size={18} /> Salir
        </button>
      </div>
    </aside>
  );
}
