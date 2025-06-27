// src/components/RutaProtegida.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";

export default function RutaProtegida({ children }: { children: ReactNode }) {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenQuery = params.get("token");

    // Guarda el token recibido por URL (Vex Core)
    if (tokenQuery) {
      localStorage.setItem("token", tokenQuery);
    }

    const token = tokenQuery || localStorage.getItem("token");

    if (!token) {
      setAutorizado(false);
      return;
    }

    // Valida permiso en Vex Core para el módulo CRM
    fetch(`${import.meta.env.VITE_CORE_URL}/modulos/crm`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => setAutorizado(res.ok))
      .catch(() => setAutorizado(false));
  }, []);

  // Muestra pantalla de carga mientras se verifica
  if (autorizado === null) return <p className="p-6">Cargando...</p>;

  // Si no está autorizado, redirige al login
  if (!autorizado) return <Navigate to="/login" />;

  // Si está en la raíz, redirige al dashboard
  if (location.pathname === "/") return <Navigate to="/dashboard" />;

  return <>{children}</>;
}
