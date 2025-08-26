// src/utils/logout.js
import api from "./api";

const CORE_URL = import.meta.env?.VITE_CORE_URL || "https://vex-core-frontend.vercel.app/";

let alreadyLoggingOut = false;

export function logout({ redirect = true } = {}) {
  if (alreadyLoggingOut) return;
  alreadyLoggingOut = true;

  try {
    // 🔐 limpiar credenciales (ambos esquemas por compat)
    localStorage.removeItem("vex_token");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_email");
    localStorage.removeItem("organizacion_id");

    // 🧽 limpiar header Authorization en axios si quedó cacheado
    if (api?.defaults?.headers) {
      delete api.defaults.headers.Authorization;
    }

    // 📢 notificar a otras pestañas
    localStorage.setItem("logout-event", String(Date.now()));
  } finally {
    // ↩️ redirigir a Core
    if (redirect) window.location.replace(CORE_URL);
  }
}

/** Reacciona a login/logout realizados en otras pestañas */
export function installSessionSyncHandlers() {
  window.addEventListener("storage", (e) => {
    if (e.key === "logout-event") {
      logout();
    }
    if (e.key === "login-event") {
      window.location.reload();
    }
  });
}
