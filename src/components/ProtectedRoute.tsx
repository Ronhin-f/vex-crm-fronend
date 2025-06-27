import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAutorizado(false);
      return;
    }

    fetch("https://vex-core-backend-production.up.railway.app/modulos/crm", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAutorizado(data?.habilitado === true))
      .catch(() => setAutorizado(false));
  }, []);

  if (autorizado === null) return <div className="p-6">🔒 Verificando acceso...</div>;
  if (!autorizado) return <Navigate to="/" />;

  return <Outlet />;
}
