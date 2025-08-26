// src/hooks/useAuthFromLocalStorage.js
// Carga el usuario desde localStorage y expone helpers (igual a Stock).
import { useEffect, useState } from "react";
import { coreApi } from "../utils/api";

export function useAuth() {
  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("vex_token");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!usuario && token) {
          const { data } = await coreApi.get("/usuarios/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const u = data?.usuario;
          if (u?.email && (u?.organizacion_id || u?.organization_id)) {
            localStorage.setItem("user", JSON.stringify(u));
            if (active) setUsuario(u);
          } else {
            throw new Error("Usuario inválido");
          }
        }
      } catch {
        localStorage.removeItem("vex_token");
        localStorage.removeItem("user");
        if (active) setUsuario(null);
        // redirige a Core para login
        window.location.href = "https://vex-core-frontend.vercel.app";
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  const logout = () => {
    localStorage.removeItem("vex_token");
    localStorage.removeItem("user");
    // evento cross-tab (igual que Stock)
    localStorage.setItem("logout-event", String(Date.now()));
    window.location.href = "https://vex-core-frontend.vercel.app/";
  };

  return {
    usuario,
    token,
    rol: usuario?.rol || null,
    organization_id: usuario?.organization_id || usuario?.organizacion_id || null,
    loading,
    logout,
  };
}
