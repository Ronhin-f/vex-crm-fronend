import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// 🧠 Agrega solo el token JWT en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// 🔐 Manejo de errores de sesión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expirado o inválido. Cerrando sesión.");
      localStorage.removeItem("token");
      window.location.href = "https://vex-core.vercel.app/login"; // o la URL real de Core
    }
    return Promise.reject(error);
  }
);

export default api;
