import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { logout } from "./logout";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");

  // Evitá pisar tipos especiales de AxiosHeaders con objetos comunes
  if (token && config.headers) {
    config.headers.set?.("Authorization", `Bearer ${token}`);
  }

  return config;
});

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
