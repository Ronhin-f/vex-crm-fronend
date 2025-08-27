// src/utils/vexKanbanApi.js
import api from "./api"; // usamos el cliente global que ya tiene baseURL + Authorization

// --- (opcional) pequeño logger para ver a qué URL pega en consola ---
if (!api.__kanbanDebugInterceptor) {
  api.interceptors.request.use((cfg) => {
    try {
      // Loguea la URL final (sacalo si molesta)
      console.info("[API]", (cfg.baseURL || "") + (cfg.url || ""));
    } catch {}
    return cfg;
  });
  api.__kanbanDebugInterceptor = true;
}

// Clientes (Pipeline)
export async function fetchClientesKanban() {
  const { data } = await api.get("/kanban/clientes");
  return data; // { columns: [...] }
}

export async function moveCliente(id, categoria) {
  const { data } = await api.patch(`/kanban/clientes/${id}/move`, { categoria });
  return data;
}

// Tareas (Kanban)
export async function fetchTareasKanban() {
  const { data } = await api.get("/kanban/tareas");
  return data; // { columns: [...] }
}

export async function moveTarea(id, estado, orden) {
  const { data } = await api.patch(`/kanban/tareas/${id}/move`, { estado, orden });
  return data;
}

// KPIs
export async function fetchKpis() {
  const { data } = await api.get("/kanban/kpis");
  return data; // { clientesPorCat, tareasPorEstado, proximos7d }
}
