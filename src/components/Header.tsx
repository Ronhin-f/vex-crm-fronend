import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // Redirige al home o página vacía si no hay login local
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `btn btn-sm ${isActive ? "btn-primary" : "btn-outline"}`;

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-base-100 shadow mb-6 gap-4">
      <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
        <img
          src="/assets/logo-vex-crm.png"
          alt="Vex CRM"
          className="h-12"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />

        <div>
          <h1 className="text-2xl font-bold text-primary">Vex CRM</h1>
          <nav className="flex flex-wrap gap-2 mt-1">
            <NavLink to="/" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/clientes" className={linkClass}>
              Clientes
            </NavLink>
            <NavLink to="/tareas" className={linkClass}>
              Tareas
            </NavLink>
            <NavLink to="/compras" className={linkClass}>
              Compras
            </NavLink>
          </nav>
        </div>
      </div>

      {usuario && (
        <div className="flex flex-col sm:items-end w-full sm:w-auto gap-1 text-sm text-neutral">
          <span>
            Sesión: <strong>{usuario.email}</strong> ({usuario.rol})
          </span>
          <button onClick={handleLogout} className="btn btn-xs btn-error">
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
