// src/utils/api.js
// Cliente Axios con Authorization automático y manejo de sesión.
// - Añade Bearer a cada request (salvo endpoints públicos)
// - Valida expiración del JWT sin librerías
// - Ante 401/403 limpia sesión y dispara logout cross-tab

import axios from "axios";

// ────────────────────────── Base URLs (env) ──────────────────────────
const API_CORE_URL = (import.meta.env.VITE_API_CORE_URL || "https://vex-core-backend-production.up.railway.app").replace(/\/+$/, "");
const API_CRM_URL  = (import.meta.env.VITE_API_CRM_URL  || (import.meta.env.VITE_API_URL || "http://localhost:3000")).replace(/\/+$/, "");

export const coreApi = axios.create({ baseURL: API_CORE_URL });
export const crmApi  = axios.create({ baseURL: API_CRM_URL });

// ────────────────────────── Utils ──────────────────────────
function decodeJwt(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function pathFromConfig(config) {
  try {
    const u = config.url || "";
    if (/^https?:\/\//i.test(u)) return new URL(u).pathname;
    return u.startsWith("/") ? u : `/${u}`;
  } catch {
    return config.url || "/";
  }
}

function isPublicEndpoint(config) {
  const p = pathFromConfig(config);
  // Endpoints públicos del backend (no requieren token)
  return (
    /^\/healthz?$/.test(p) ||
    /^\/upload(\/|$)/.test(p) ||    // /upload/estimate
    /^\/uploads(\/|$)/.test(p)      // estáticos
  );
}

function broadcastLogout() {
  try {
    // Limpiamos solo claves de sesión para no pisar preferencias del usuario
    const keys = ["vex_token", "token", "user", "organizacion_id", "usuario_email"];
    keys.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem("logout-event", String(Date.now()));
  } catch {}
}

function setupInterceptor(apiInstance, name) {
  // Request: Authorization + validación de exp
  apiInstance.interceptors.request.use((config) => {
    if (isPublicEndpoint(config)) return config;

    const token = localStorage.getItem("vex_token");
    if (!token) {
      // Sin token: cancelamos request para no ensuciar logs/toasts
      throw new axios.Cancel(`[${name}] Sin token`);
    }
    const payload = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.exp || payload.exp < now) {
      broadcastLogout();
      throw new axios.Cancel(`[${name}] Token expirado`);
    }
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Response: si backend dice 401/403 → cerrar sesión
  apiInstance.interceptors.response.use(
    (res) => res,
    (error) => {
      if (axios.isCancel(error)) return Promise.reject(error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        broadcastLogout();
      }
      return Promise.reject(error);
    }
  );
}

setupInterceptor(coreApi, "Core");
setupInterceptor(crmApi, "CRM");

// Export por defecto: apuntamos al backend CRM
const api = crmApi;
export default api;
