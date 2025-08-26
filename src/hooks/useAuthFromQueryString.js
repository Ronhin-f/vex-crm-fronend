// src/hooks/useAuthFromQueryString.js
// Lee ?vex_token=&user= de la URL (redirige desde Core), guarda en localStorage y opcionalmente navega a /crm.
import { useEffect } from "react";

export default function useAuthFromQueryString() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("vex_token");
    const userRaw = params.get("user");

    if (token && userRaw) {
      try {
        const decodedUser = JSON.parse(decodeURIComponent(userRaw));
        if (decodedUser?.email && (decodedUser?.organizacion_id || decodedUser?.organization_id)) {
          localStorage.setItem("vex_token", token);
          localStorage.setItem("user", JSON.stringify(decodedUser));
          // para tabs hermanas
          localStorage.setItem("login-event", String(Date.now()));

          const current = window.location.pathname;
          // Ajustá si tu dashboard vive en otra ruta
          if (current === "/" || current === "/welcome" || current === "/home") {
            setTimeout(() => { window.location.href = "/crm"; }, 120);
          }
        } else {
          // usuario inválido → limpiar
          localStorage.clear();
        }
      } catch {
        localStorage.clear();
      }
    }
  }, []);
}
