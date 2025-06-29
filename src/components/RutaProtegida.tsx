// src/components/RutaProtegida.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";

export default function RutaProtegida({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenQuery = params.get("token");

    if (tokenQuery) {
      localStorage.setItem("token", tokenQuery);
    }

    const storedToken = tokenQuery || localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  if (token === null) return <p className="p-6">Cargando...</p>;
  if (!token) return <Navigate to="/login" />;

  if (location.pathname === "/") return <Navigate to="/dashboard" />;

  return <>{children}</>;
}
