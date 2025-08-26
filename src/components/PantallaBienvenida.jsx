// src/components/PantallaBienvenida.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuthFromLocalStorage";
import useAuthFromQueryString from "../hooks/useAuthFromQueryString";

export default function PantallaBienvenida() {
  useAuthFromQueryString(); // procesa ?vex_token&user= si volvemos de Core
  const { usuario } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (usuario) {
      const t = setTimeout(() => nav("/crm"), 600);
      return () => clearTimeout(t);
    }
  }, [usuario]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <img src="/logo-vex-crm.png" alt="Vex CRM" className="w-24 h-24" />
      <h1 className="text-xl font-semibold">
        {usuario ? `Bienvenido, ${usuario.nombre || usuario.email}` : "Iniciando…"}
      </h1>
      {!usuario && (
        <a
          href="https://vex-core-frontend.vercel.app/"
          className="px-4 py-2 rounded bg-black text-white"
        >
          Ir a iniciar sesión
        </a>
      )}
      <span className="loading loading-spinner loading-lg mt-2"></span>
    </div>
  );
}
