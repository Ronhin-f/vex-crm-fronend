import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// Función utilitaria para extraer datos del localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const usuario_email = localStorage.getItem("usuario_email");
  const organizacion_id = localStorage.getItem("organizacion_id");
  const headers: any = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (usuario_email) headers["usuario_email"] = usuario_email;
  if (organizacion_id) headers["organizacion_id"] = organizacion_id;

  return headers;
};

// 🔗 Interceptor de request
api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    ...getAuthHeaders(),
  };
  return config;
});

// 🔒 Interceptor de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      console.warn("⚠️ Sesión expirada");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
