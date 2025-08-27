// utils/vexKanbanApi.js
import axios from "axios";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_CRM_URL,
  withCredentials: false,
});

export async function fetchClientesKanban() {
  const { data } = await api.get("/kanban/clientes", { headers: authHeader() });
  return data; // { columns: [...] }
}

export async function moveCliente(id, categoria) {
  const { data } = await api.patch(`/categorias/clientes/${id}/move`, { categoria }, { headers: authHeader() });
  return data;
}

export async function fetchTareasKanban() {
  const { data } = await api.get("/kanban/tareas", { headers: authHeader() });
  return data; // { columns: [...] }
}

export async function moveTarea(id, estado, orden) {
  const { data } = await api.patch(`/kanban/tareas/${id}/move`, { estado, orden }, { headers: authHeader() });
  return data;
}

export async function fetchKpis() {
  const { data } = await api.get("/kanban/kpis", { headers: authHeader() });
  return data; // { clientesPorCat, tareasPorEstado, proximos7d }
}
