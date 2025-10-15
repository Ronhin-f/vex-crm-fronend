// src/utils/api.js
// Cliente Axios con Authorization automático y manejo de sesión.
// - Añade Bearer a cada request (salvo endpoints públicos)
// - Valida expiración del JWT sin librerías
// - Ante 401/403 limpia sesión y dispara logout cross-tab
// - Permite override de baseURL en runtime (localStorage / window var)

import axios from "axios";

/* ────────────────────────── Base URLs (env) ────────────────────────── */
const ENV_CORE = (import.meta.env.VITE_API_CORE_URL || "https://vex-core-backend-production.up.railway.app").replace(/\/+$/, "");
const ENV_CRM  = (import.meta.env.VITE_API_CRM_URL  || (import.meta.env.VITE_API_URL || "http://localhost:3000")).replace(/\/+$/, "");

/* Helpers para override en runtime (debug/SSO bridge) */
function pickRuntimeBase(key, fallback) {
  try {
    const winHint = (typeof window !== "undefined" && window[key]) ? String(window[key]) : "";
    const ls = (typeof localStorage !== "undefined" && localStorage.getItem("vex_api_base")) || "";
    const chosen = (winHint || ls || "").trim();
    return (chosen || fallback).replace(/\/+$/, "");
  } catch {
    return fallback;
  }
}

export const coreApi = axios.create({ baseURL: pickRuntimeBase("__VEX_CORE_API_BASE__", ENV_CORE) });
export const crmApi  = axios.create({ baseURL: pickRuntimeBase("__VEX_API_BASE__", ENV_CRM) });

/* Exponer atajos para ajustar el baseURL en caliente desde consola si hace falta */
if (typeof window !== "undefined") {
  window.__VEX_SET_API__ = (u) => { crmApi.defaults.baseURL = String(u || ENV_CRM).replace(/\/+$/, ""); console.info("[api] crm base =", crmApi.defaults.baseURL); };
  window.__VEX_SET_CORE__ = (u) => { coreApi.defaults.baseURL = String(u || ENV_CORE).replace(/\/+$/, ""); console.info("[api] core base =", coreApi.defaults.baseURL); };
}

/* ────────────────────────── Utils ────────────────────────── */
function decodeJwt(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
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

/* Endpoints públicos del backend (no requieren token) */
function isPublicEndpoint(config) {
  const p = pathFromConfig(config);
  return (
    /^\/?$/.test(p) ||                // root ok
    /^\/healthz?$/.test(p) ||         // /health o /healthz
    /^\/api\/health$/.test(p) ||      // /api/health
    /^\/upload(\/|$)/.test(p) ||      // /upload/estimate
    /^\/uploads(\/|$)/.test(p)        // estáticos
  );
}

/* Token + contexto desde localStorage con fallbacks */
function getToken() {
  try {
    return localStorage.getItem("vex_token") || localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}
function getOrgId() {
  try {
    return localStorage.getItem("vex_org_id") || localStorage.getItem("organizacion_id") || "";
  } catch { return ""; }
}
function getUserEmail() {
  try {
    return localStorage.getItem("vex_user") || localStorage.getItem("usuario_email") || "";
  } catch { return ""; }
}

function broadcastLogout() {
  try {
    const keys = ["vex_token", "token", "user", "vex_user", "vex_org_id", "organizacion_id", "usuario_email"];
    keys.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem("logout-event", String(Date.now())); // cross-tab
    console.warn("[api] logout broadcast");
  } catch {}
}

function setupInterceptor(apiInstance, name) {
  // Request: Authorization + validación de exp
  apiInstance.interceptors.request.use((config) => {
    if (isPublicEndpoint(config)) return config;

    const token = getToken();
    if (!token) {
      // Sin token: cancelamos request para no ensuciar toasts; el caller decide qué hacer
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

    // Contexto opcional (no requerido, pero útil para auditoría/routers passthrough)
    const orgId = getOrgId();
    const uEmail = getUserEmail();
    if (orgId)   config.headers["X-Org-Id"] = orgId;
    if (uEmail)  config.headers["X-User-Email"] = uEmail;

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

/* Reaplicar overrides si el SSO bridge escribe en localStorage después del boot */
if (typeof window !== "undefined") {
  window.addEventListener("vex:token-ready", () => {
    try {
      const hint = localStorage.getItem("vex_api_base");
      if (hint) {
        crmApi.defaults.baseURL = hint.replace(/\/+$/, "");
        console.info("[api] baseURL actualizado por bridge:", crmApi.defaults.baseURL);
      }
    } catch {}
  });
}

/* Export por defecto: apuntamos al backend CRM */
const api = crmApi;
export default api;
