// src/lib/api.js — instancia para el backend del CRM
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

export const api = axios.create({
  baseURL: BASE_URL || "/api",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Propaga organizacion_id desde localStorage si no vino en params
  const orgFromLs = localStorage.getItem("organizacion_id");
  if (orgFromLs) {
    config.params = {
      ...(config.params || {}),
      organizacion_id: config.params?.organizacion_id ?? orgFromLs,
    };
    config.headers = config.headers || {};
    config.headers["X-Org-Id"] = orgFromLs;
  }
  return config;
});

export function unwrap(promise) {
  return promise
    .then((res) => res.data)
    .catch((err) => {
      const status = err?.response?.status;
      const message = err?.response?.data?.error || err.message;
      return Promise.reject({ status, message });
    });
}
