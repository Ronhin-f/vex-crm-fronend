// src/components/RutaProtegida.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

export default function RutaProtegida({ children }: Props) {
  const { token } = useAuth();
  const [autorizado, setAutorizado] = useState<boolean | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenQuery = params.get("token");

    if (tokenQuery) {
      localStorage.setItem("token", tokenQuery);
      window.location.href = window.location.pathname; // Limpia la URL
      return;
    }

    const t = token || localStorage.getItem("token");
    if (!t) {
      setAutorizado(false);
      return;
    }

    const validarModulo = async () => {
      try {
        const res = await fetch("https://vex-core-backend-production.up.railway.app/modulos/crm", {
          headers: { Authorization: `Bearer ${t}` },
        });
        const data = await res.json();
        setAutorizado(data?.habilitado === true);
      } catch (err) {
        console.error("Error al validar módulo CRM:", err);
        setAutorizado(false);
      }
    };

    validarModulo();
  }, [token]);

  if (autorizado === null) return <div className="p-6">🔐 Verificando acceso...</div>;
  if (!autorizado) {
    return (
      <div className="p-6 text-red-600">
        🚫 Acceso denegado al módulo CRM.
        <br />
        <a className="underline" href="https://core.vex.com/login">Volver al inicio</a>
      </div>
    );
  }

  return <>{children}</>;
}
