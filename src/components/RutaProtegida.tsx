// src/components/RutaProtegida.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";

export default function RutaProtegida({ children }: { children: ReactNode }) {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenQuery = params.get("token");

    if (tokenQuery) {
      localStorage.setItem("token", tokenQuery);
    }

    const token = tokenQuery || localStorage.getItem("token");
    if (!token) {
      setAutorizado(false);
      return;
    }

    fetch("https://vex-core-backend-production.up.railway.app/modulos/crm", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => setAutorizado(res.ok))
      .catch(() => setAutorizado(false));
  }, []);

  if (autorizado === null) return <p className="p-6">Cargando...</p>;
  if (!autorizado) return <Navigate to="/login" />;

  if (location.pathname === "/") return <Navigate to="/dashboard" />;

  return <>{children}</>;
}
