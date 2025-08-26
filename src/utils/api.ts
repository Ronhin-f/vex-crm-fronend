// src/utils/api.ts
import axios from "axios";
import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosHeaders,
  RawAxiosRequestHeaders,
} from "axios";
import { logout } from "./logout";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

function setAuthHeader(
  headers: InternalAxiosRequestConfig["headers"],
  token: string
) {
  if (!headers) return;

  // Puede venir como AxiosHeaders (con .set) o objeto plano
  const h = headers as AxiosHeaders | RawAxiosRequestHeaders;

  if (typeof (h as AxiosHeaders).set === "function") {
    (h as AxiosHeaders).set("Authorization", `Bearer ${token}`);
  } else {
    (h as RawAxiosRequestHeaders)["Authorization"] = `Bearer ${token}`;
  }
}

// ✅ Interceptor de requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("token");
    if (token) setAuthHeader(config.headers, token);
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔐 Interceptor de respuestas
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expirado o inválido. Cerrando sesión.");
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;
