import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import { Toaster } from "react-hot-toast";
import { useCrossTabLogout } from "./hooks/useCrossTabLogout.js"; // ✅ ruta correcta
import { Menu } from "lucide-react";

export default function App() {
  useCrossTabLogout();

  // Cierra el drawer en mobile después de navegar / salir
  const closeDrawer = () => {
    const el = document.getElementById("vex-drawer");
    if (el && window.innerWidth < 1024) el.checked = false; // <lg
  };

  return (
    <div className="drawer lg:drawer-open bg-base-200 min-h-screen">
      {/* toggle del drawer */}
      <input id="vex-drawer" type="checkbox" className="drawer-toggle" />

      {/* CONTENIDO */}
      <div className="drawer-content flex flex-col">
        {/* Topbar solo en mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-base-100/80 backdrop-blur border-b border-base-200">
          <div className="px-4 py-3 flex items-center gap-2">
            <label htmlFor="vex-drawer" className="btn btn-ghost btn-sm" aria-label="Abrir menú">
              <Menu size={18} />
            </label>
            <div className="font-semibold">Vex CRM</div>
          </div>
        </header>

        <main className="p-4 md:p-6 flex-1">
          <Toaster position="top-right" />
          <Outlet />
        </main>
      </div>

      {/* SIDEBAR */}
      <div className="drawer-side">
        <label htmlFor="vex-drawer" className="drawer-overlay" aria-label="Cerrar menú"></label>
        <Sidebar onNavigate={closeDrawer} />
      </div>
    </div>
  );
}
