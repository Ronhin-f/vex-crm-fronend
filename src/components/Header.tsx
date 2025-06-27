import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { usuario_email, rol, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex justify-between items-center p-4 bg-base-100 shadow mb-6">
      <div className="flex items-start gap-4">
        <img src="/assets/logo-vex-crm.png" alt="Vex CRM" className="h-12" />

        <div>
          <h1 className="text-2xl font-bold text-primary">Vex CRM</h1>
          <nav className="flex flex-wrap gap-2 mt-1">
            <Link to="/dashboard" className="btn btn-sm btn-outline">Dashboard</Link>
            <Link to="/clientes" className="btn btn-sm btn-outline">Clientes</Link>
            <Link to="/tareas" className="btn btn-sm btn-outline">Tareas</Link>
            <Link to="/compras" className="btn btn-sm btn-outline">Compras</Link>
          </nav>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="text-sm text-neutral">Sesión: {usuario_email} ({rol})</span>
        <button onClick={handleLogout} className="btn btn-xs btn-error">Cerrar sesión</button>
      </div>
    </header>
  );
};

export default Header;
