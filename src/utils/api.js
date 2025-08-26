// src/utils/api.js
// Interceptor estilo Stock. Valida exp del JWT y agrega Authorization.
// Sin dependencias extras (sin jwt-decode).
import axios from "axios";

// URLs por env (igual que Stock; ajustá VITE_API_CRM_URL si querés)
const API_CORE_URL = (import.meta.env.VITE_API_CORE_URL || "https://vex-core-backend-production.up.railway.app").replace(/\/+$/, "");
const API_CRM_URL  = (import.meta.env.VITE_API_CRM_URL  || (import.meta.env.VITE_API_URL || "http://localhost:3000")).replace(/\/+$/, "");

export const coreApi = axios.create({ baseURL: API_CORE_URL });
export const crmApi  = axios.create({ baseURL: API_CRM_URL });

// Decodificador JWT simple (sin librerías)
function decodeJwt(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(atob(b64).split("").map(c => "%"+("00"+c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function setupInterceptor(apiInstance, name) {
  apiInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("vex_token");
    if (!token) {
      // Sin token: cancelamos request para no ensuciar logs
      throw new axios.Cancel(`[${name}] Sin token`);
    }
    const payload = decodeJwt(token);
    const now = Math.floor(Date.now()/1000);
    if (!payload?.exp || payload.exp < now) {
      // Expirado → limpiar y cancelar
      localStorage.clear();
      throw new axios.Cancel(`[${name}] Token expirado`);
    }
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

setupInterceptor(coreApi, "Core");
setupInterceptor(crmApi, "CRM");

// Export por defecto (igual que Stock, “api” apunta a nuestro backend CRM)
const api = crmApi;
export default api;
