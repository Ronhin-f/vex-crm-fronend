// src/components/RutaProtegida.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, type ReactNode } from "react";

export default function RutaProtegida({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) return <div className="text-center py-10">Cargando...</div>;
  return token ? <>{children}</> : <Navigate to="/login" />;
}
