import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// ✅ Interceptor: agrega token si existe, con headers bien tipeados
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`,
    } as typeof config.headers; // ⬅️ esto es lo que resuelve el error
  }

  return config;
});

// 🔐 Manejo de errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expirado o inválido. Cerrando sesión.");
      localStorage.removeItem("token");
      window.location.href = "https://vex-core.vercel.app/login"; // o tu URL real
    }
    return Promise.reject(error);
  }
);

export default api;
