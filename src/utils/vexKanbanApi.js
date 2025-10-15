// src/utils/vexKanbanApi.js
import api from "./api";

/** Util: arma querystring limpio a partir de un objeto */
function qs(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (String(v).trim() === "") return;
    p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Orden genérico por due_date (o la key que pases) y fallback created_at */
function sortByDue(items = [], dueKey = "due_date") {
  const arr = [...items];
  arr.sort((a, b) => {
    const da = a[dueKey] ? new Date(a[dueKey]).getTime() : Infinity;
    const db = b[dueKey] ? new Date(b[dueKey]).getTime() : Infinity;
    if (da !== db) return da - db;
    const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
    const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return cb - ca; // más nuevo primero
  });
  return arr;
}

// ─────────────────── Pipeline por defecto ───────────────────
const DEFAULT_PIPELINE = [
  "Incoming Leads",
  "Unqualified",
  "Qualified",
  "Follow-up Missed",
  "Bid/Estimate Sent",
  "Won",
  "Lost",
];

// ─────────────────── Clientes: Kanban ───────────────────
// Soporta filtros: q, source, assignee, only_due
export async function fetchClientesKanban(filters = {}) {
  // Preferimos /clientes/kanban (BE nuevo) -> /kanban/clientes (legacy) -> /clientes (lista)
  try {
    const { data } = await api.get(`/clientes/kanban${qs(filters)}`);
    return normalizeKanban(data);
  } catch {
    try {
      const { data } = await api.get(`/kanban/clientes${qs(filters)}`);
      return normalizeKanban(data);
    } catch {
      const { data: lista } = await api.get(`/clientes${qs(filters)}`);
      const order = [...DEFAULT_PIPELINE];
      const columns = {};
      order.forEach((k) => (columns[k] = []));
      (lista || []).forEach((c) => {
        const stage = c.stage || DEFAULT_PIPELINE[0];
        if (!columns[stage]) columns[stage] = [];
        columns[stage].push(c);
      });
      return normalizeKanban({ columns, order });
    }
  }
}

// ─────────────────── Proyectos: Kanban ───────────────────
export async function fetchProyectosKanban(filters = {}) {
  // Preferimos /proyectos/kanban (BE nuevo) -> /kanban/proyectos (legacy) -> /proyectos (lista)
  try {
    const { data } = await api.get(`/proyectos/kanban${qs(filters)}`);
    return normalizeKanban(data);
  } catch {
    try {
      const { data } = await api.get(`/kanban/proyectos${qs(filters)}`);
      return normalizeKanban(data);
    } catch {
      const { data: lista } = await api.get(`/proyectos${qs(filters)}`);
      const order = [...DEFAULT_PIPELINE];
      const columns = {};
      order.forEach((k) => (columns[k] = []));
      (lista || []).forEach((p) => {
        const stage = p.stage || DEFAULT_PIPELINE[0];
        if (!columns[stage]) columns[stage] = [];
        columns[stage].push(p);
      });
      return normalizeKanban({ columns, order });
    }
  }
}

// Normaliza + ordena por due_date y fallback created_at
function normalizeKanban(raw) {
  let order = raw?.order?.length ? raw.order : [...DEFAULT_PIPELINE];
  const columns = {};

  if (Array.isArray(raw?.columns)) {
    for (const col of raw.columns) {
      const key = col.key || col.title || DEFAULT_PIPELINE[0];
      const arr = sortByDue([...(col.items || [])], "due_date");
      columns[key] = arr;
    }
    if (!raw?.order?.length) {
      const extras = Object.keys(columns).filter((k) => !order.includes(k));
      order = [...order, ...extras];
    }
  } else {
    const incomingKeys = raw?.columns ? Object.keys(raw.columns) : [];
    const extras = incomingKeys.filter((k) => !order.includes(k));
    order = raw?.order?.length ? raw.order : [...order, ...extras];

    for (const col of order) {
      const arr = sortByDue([...(raw?.columns?.[col] || [])], "due_date");
      columns[col] = arr;
    }
  }

  return { order, columns };
}

// ─────────────────── Moves (drag & drop) ───────────────────
export async function moveCliente(id, stage, orden) {
  // BE nuevo
  try {
    const payload = { stage };
    if (typeof orden === "number") payload.orden = orden;
    const { data } = await api.patch(`/clientes/${id}/stage`, payload);
    return data;
  } catch {
    // Legacy
    const payload = { stage };
    if (typeof orden === "number") payload.orden = orden;
    const { data } = await api.patch(`/kanban/clientes/${id}/move`, payload);
    return data;
  }
}

export async function moveProyecto(id, stage, orden) {
  // BE nuevo
  try {
    const payload = { stage };
    if (typeof orden === "number") payload.orden = orden;
    const { data } = await api.patch(`/proyectos/${id}/stage`, payload);
    return data;
  } catch {
    // Legacy
    const payload = { stage };
    if (typeof orden === "number") payload.orden = orden;
    const { data } = await api.patch(`/kanban/proyectos/${id}/move`, payload);
    return data;
  }
}

// ─────────────────── Tareas: Kanban ───────────────────
export async function fetchTareasKanban(filters = {}) {
  // Preferimos /tareas/kanban -> /kanban/tareas -> /tareas
  try {
    const { data } = await api.get(`/tareas/kanban${qs(filters)}`);
    return normalizeTasks(data);
  } catch {
    try {
      const { data } = await api.get(`/kanban/tareas${qs(filters)}`);
      return normalizeTasks(data);
    } catch {
      const { data: lista = [] } = await api.get(`/tareas${qs(filters)}`);
      const byEstado = new Map();
      (Array.isArray(lista) ? lista : []).forEach((t) => {
        const key = t.estado || "todo";
        if (!byEstado.has(key)) byEstado.set(key, []);
        byEstado.get(key).push(t);
      });
      const defaultOrder = ["todo", "doing", "waiting", "done"];
      const order = byEstado.size ? Array.from(byEstado.keys()) : defaultOrder;
      const columns = order.map((k) => {
        const items = sortByDue(byEstado.get(k) || [], "due_date");
        return { key: k, title: k, items, count: items.length };
      });
      return { columns, order };
    }
  }
}

function normalizeTasks(data) {
  if (Array.isArray(data?.columns)) {
    const columns = data.columns.map((c) => ({
      ...c,
      items: sortByDue(c.items || [], "due_date"),
      count: (c.items || []).length,
    }));
    const order = data.order?.length ? data.order : columns.map((c) => c.key || c.title);
    return { columns, order };
  }
  if (data?.columns && typeof data.columns === "object") {
    const order = data.order?.length ? data.order : Object.keys(data.columns);
    const columns = order.map((k) => {
      const items = sortByDue(data.columns[k] || [], "due_date");
      return { key: k, title: k, items, count: items.length };
    });
    return { columns, order };
  }
  return { columns: [], order: [] };
}

export async function moveTarea(id, estado, orden) {
  // Intento BE nuevo
  try {
    const payload = { estado };
    if (typeof orden === "number") payload.orden = orden;
    const { data } = await api.patch(`/tareas/${id}/state`, payload);
    return data;
  } catch {
    const payload = { estado };
    if (typeof orden === "number") payload.orden = orden;
    const { data } = await api.patch(`/kanban/tareas/${id}/move`, payload);
    return data;
  }
}

// ─────────────────── KPIs (Dashboard) ───────────────────
export async function fetchKpis(params = {}) {
  // Cache-buster para evitar 304/CDN
  const { data } = await api.get(`/analytics/kpis${qs({ ...params, t: Date.now() })}`);
  return data;
}
