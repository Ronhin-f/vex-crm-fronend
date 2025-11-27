// src/lib/api.js — instancia para el backend del CRM
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

export const api = axios.create({
  baseURL: BASE_URL || "",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Adjunta org solo si tenemos una guardada; no hardcodear.
  const storedOrg = localStorage.getItem("vex_org_id") || localStorage.getItem("organizacion_id");
  const hasOrgInParams = !!config.params?.org;
  if (storedOrg && !hasOrgInParams) {
    config.params = { ...(config.params || {}), org: storedOrg };
  }
  if (storedOrg) {
    config.headers = config.headers || {};
    config.headers["X-Org-Id"] = storedOrg;
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
