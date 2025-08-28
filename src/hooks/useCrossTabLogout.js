// src/hooks/useCrossTabLogout.js
import { useEffect } from "react";

/**
 * Listener cross-tab idempotente.
 * - Refresca la UI cuando otra pestaña hace login (login-event).
 * - No hace logout manual: eso ya lo maneja useAuthFromLocalStorage
 *   limpiando estado y dejando que RutaPrivada redirija.
 */
let isBound = false;
let handler = null;

export function useCrossTabLogout() {
  useEffect(() => {
    if (isBound) return;

    handler = (e) => {
      if (e.key === "login-event") {
        // Otra pestaña inició sesión → rehidratar contexto y rutas
        window.location.reload();
      }
      // `logout-event` ya es manejado por useAuthFromLocalStorage,
      // que limpia token/usuario y RutaPrivada te saca a Core.
    };

    window.addEventListener("storage", handler);
    isBound = true;

    return () => {
      if (handler) window.removeEventListener("storage", handler);
      isBound = false;
      handler = null;
    };
  }, []);
}
