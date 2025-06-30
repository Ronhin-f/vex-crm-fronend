import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { logout } from "./logout";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// ✅ Interceptor de requests: agrega el token si existe
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");

  if (token && config.headers) {
    // Soporte para Headers tipo HeadersMap (TS 5.x+)
    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      // Fallback para headers como objeto plano
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return config;
});

// 🔐 Interceptor de respuestas: si el token expira, se cierra sesión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expirado o inválido. Cerrando sesión.");
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;
