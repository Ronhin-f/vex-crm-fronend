// src/lib/flows.js — instancia para Vex Flows
import axios from "axios";

const BASE = import.meta.env.VITE_FLOWS_BASE_URL?.replace(/\/$/, "") || "";

export const flows = axios.create({
  baseURL: BASE || "/flows",
  withCredentials: false,
});

flows.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function unwrapFlows(promise) {
  return promise
    .then((r) => r.data)
    .catch((err) => {
      const status = err?.response?.status;
      const message = err?.response?.data?.error || err.message;
      return Promise.reject({ status, message });
    });
}
