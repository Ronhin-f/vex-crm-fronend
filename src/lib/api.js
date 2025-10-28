// src/lib/api.js — instancia para el backend del CRM
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
const DEFAULT_ORG = 10;

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
  // asegura ?org=10 si no vino en token ni en params
  const hasOrgInUrl = /([?&])org=\d+/.test(config.url || "");
  const hasOrgInParams = !!config.params?.org;
  if (!hasOrgInUrl && !hasOrgInParams) {
    config.params = { ...(config.params || {}), org: DEFAULT_ORG };
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
