// src/components/RutaPrivada.jsx
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Guarda rutas privadas detrás de token de Core.
 * - Si NO hay token: redirige duro al login de Core (VITE_CORE_LOGIN_URL) con ?next=<url_actual>
 * - Soporta `rolRequerido` como string o array de strings.
 */
export default function RutaPrivada({ children, rolRequerido }) {
  const { token, usuario } = useAuth();

  const required = Array.isArray(rolRequerido)
    ? rolRequerido
    : rolRequerido
    ? [rolRequerido]
    : [];

  const coreBase = (import.meta.env.VITE_CORE_LOGIN_URL || "https://vex-core-frontend.vercel.app").replace(/\/+$/, "");
  const next = typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";
  const loginUrl = `${coreBase}/?next=${next}`;

  // Redirección dura si no hay token (evita loops y rutas inexistentes)
  useEffect(() => {
    if (!token) {
      window.location.href = loginUrl;
    }
  }, [token, loginUrl]);

  if (!token) {
    // Fallback visible mientras navega el browser
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="loading loading-spinner loading-lg mb-2" />
        <p className="opacity-80">Redirigiendo a iniciar sesión…</p>
        <a className="link link-primary" href={loginUrl}>
          Ir al login ahora
        </a>
      </div>
    );
  }

  if (required.length && !required.includes(usuario?.rol)) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Acceso restringido</h1>
        <p className="opacity-70">Tu rol no tiene permiso para ver esta sección.</p>
      </div>
    );
  }

  return children;
}
