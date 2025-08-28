// src/utils/logout.js
// Manejo centralizado de logout + sincronización entre pestañas.
import api from "./api";

const CORE_LOGIN_BASE = (import.meta.env?.VITE_CORE_LOGIN_URL || "https://vex-core-frontend.vercel.app").replace(/\/+$/, "");

let alreadyLoggingOut = false;

/**
 * Cierra sesión local y redirige al Login de Core con ?next=<url>.
 * @param {{ redirect?: boolean, nextUrl?: string }} opts
 */
export function logout({ redirect = true, nextUrl } = {}) {
  if (alreadyLoggingOut) return;
  alreadyLoggingOut = true;

  try {
    // 🔐 limpiar credenciales (ambos esquemas por compat)
    localStorage.removeItem("vex_token");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_email");
    localStorage.removeItem("organizacion_id");

    // 🧽 limpiar Authorization en axios (por si alguien lo seteó manual)
    try {
      if (api?.defaults?.headers?.common) delete api.defaults.headers.common.Authorization;
      if (api?.defaults?.headers) delete api.defaults.headers.Authorization;
    } catch {}

    // 📢 notificar a otras pestañas
    try { localStorage.setItem("logout-event", String(Date.now())); } catch {}
  } finally {
    if (redirect && typeof window !== "undefined") {
      const next = encodeURIComponent(nextUrl || window.location.origin);
      const url = `${CORE_LOGIN_BASE}/?next=${next}`;
      window.location.replace(url);
    }
  }
}

/**
 * Instala listeners cross-tab para reflejar login/logout hechos en otra pestaña.
 * Nota: si ya usás el hook `useAuthFromLocalStorage`, esto es opcional.
 */
let isBound = false;
export function installSessionSyncHandlers() {
  if (isBound) return;
  isBound = true;

  window.addEventListener("storage", (e) => {
    if (e.key === "logout-event") {
      // Repite el proceso localmente (sin bucle por alreadyLoggingOut)
      logout();
    }
    if (e.key === "login-event") {
      // Rehidratar UI tras login en otra pestaña
      window.location.reload();
    }
  });
}
