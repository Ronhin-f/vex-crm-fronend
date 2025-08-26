// src/utils/logout.ts
import api from "./api";

// Centralizamos la URL de Core (permite cambiar por env en dev)
const CORE_URL =
  (import.meta as any).env?.VITE_CORE_URL ??
  "https://vex-core-frontend.vercel.app/";

let alreadyLoggingOut = false;

export function logout(opts: { redirect?: boolean } = { redirect: true }) {
  if (alreadyLoggingOut) return;
  alreadyLoggingOut = true;

  try {
    // 1) limpiar credenciales locales
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_email");
    localStorage.removeItem("organizacion_id");

    // 2) limpiar headers por si axios queda en memoria
    // (evita que el interceptor reintente con un token viejo)
    if (api?.defaults?.headers) {
      delete (api.defaults.headers as any).Authorization;
    }

    // 3) notificar a otras pestañas
    localStorage.setItem("logout-event", String(Date.now()));
  } finally {
    // 4) redirigir (replace evita volver atrás con el token en history)
    if (opts.redirect !== false) {
      window.location.replace(CORE_URL);
    }
  }
}

/** Permite reaccionar a logout/login desde otras pestañas */
export function installSessionSyncHandlers() {
  window.addEventListener("storage", (e) => {
    if (e.key === "logout-event") {
      // cerramos sesión también en esta pestaña
      logout();
    }
    if (e.key === "login-event") {
      // otra pestaña inició sesión -> refrescamos para tomar el token nuevo
      window.location.reload();
    }
  });
}
