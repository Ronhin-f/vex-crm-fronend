// src/utils/vexKanbanApi.js
import api from "./api"; // cliente global con baseURL + Authorization

// Debug opcional (solo en dev o si activás localStorage.kanbanDebug = "1")
const shouldDebug =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
  (typeof window !== "undefined" && window.localStorage?.getItem("kanbanDebug") === "1");

if (shouldDebug && !api.__kanbanDebugInterceptor) {
  api.interceptors.request.use((cfg) => {
    try {
      console.info("[API]", (cfg.baseURL || "") + (cfg.url || ""));
    } catch {}
    return cfg;
  });
  api.__kanbanDebugInterceptor = true;
}

// ───────── Clientes (Pipeline) ─────────
export async function fetchClientesKanban() {
  const { data } = await api.get("/kanban/clientes");
  return data; // { columns: [...] }
}

export async function moveCliente(id, categoria) {
  const { data } = await api.patch(`/kanban/clientes/${id}/move`, { categoria });
  return data; // { id, nombre, categoria }
}

// ───────── Tareas (Kanban) ─────────
export async function fetchTareasKanban() {
  const { data } = await api.get("/kanban/tareas");
  return data; // { columns: [...] }
}

export async function moveTarea(id, estado, orden) {
  const payload = { estado };
  if (typeof orden === "number") payload.orden = orden; // solo si se especifica
  const { data } = await api.patch(`/kanban/tareas/${id}/move`, payload);
  return data; // { id, titulo, estado, orden, completada }
}

// ───────── KPIs ─────────
export async function fetchKpis() {
  const { data } = await api.get("/kanban/kpis");
  return data; // { clientesPorCat, tareasPorEstado, proximos7d }
}
