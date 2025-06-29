// src/components/RutaProtegida.tsx
import { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

export default function RutaProtegida({ children }: Props) {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);

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
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAutorizado(data?.habilitado === true))
      .catch(() => setAutorizado(false));
  }, []);

  if (autorizado === null) return <div className="p-6">🔐 Verificando acceso...</div>;
  if (!autorizado) return <div className="p-6 text-error">🚫 Acceso no autorizado.</div>;

  return <>{children}</>;
}
