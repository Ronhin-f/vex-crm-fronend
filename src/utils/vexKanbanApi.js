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

// ─────────────────── Clientes: Kanban ───────────────────
// Soportamos filtros: q, source, assignee, only_due (boolean)
export async function fetchClientesKanban(filters = {}) {
  // Endpoint kanban dedicado, si existe; si no, re-construimos desde /clientes
  try {
    const { data } = await api.get(`/kanban/clientes${qs(filters)}`);
    // data esperado: { columns: { [stage]: Cliente[] }, order: string[] }
    return normalizeKanban(data);
  } catch {
    // Fallback: traemos todos y agrupamos en FE
    const { data: lista } = await api.get(`/clientes${qs(filters)}`);
    const order = ["Incoming Leads", "Qualified", "Bid/Estimate Sent", "Won", "Lost"];
    const columns = {};
    order.forEach((k) => (columns[k] = []));
    (lista || []).forEach((c) => {
      const stage = c.stage || "Incoming Leads";
      if (!columns[stage]) columns[stage] = [];
      columns[stage].push(c);
    });
    return normalizeKanban({ columns, order });
  }
}

// Normaliza + ordena por follow-up, luego created_at/id
function normalizeKanban(raw) {
  const order = raw?.order?.length
    ? raw.order
    : ["Incoming Leads", "Qualified", "Bid/Estimate Sent", "Won", "Lost"];
  const columns = {};
  for (const col of order) {
    const arr = [...(raw?.columns?.[col] || [])];
    arr.sort((a, b) => {
      const da = a.next_follow_up ? new Date(a.next_follow_up).getTime() : Infinity;
      const db = b.next_follow_up ? new Date(b.next_follow_up).getTime() : Infinity;
      if (da !== db) return da - db;
      const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
      const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (cb !== ca) return cb - ca; // más nuevo primero
      return (a.id || 0) - (b.id || 0);
    });
    columns[col] = arr;
  }
  return { order, columns };
}

export async function moveCliente(id, stage, orden) {
  const payload = { stage };
  if (typeof orden === "number") payload.orden = orden;
  const { data } = await api.patch(`/kanban/clientes/${id}/move`, payload);
  return data;
}

// ─────────────────── Tareas (existente) ───────────────────
export async function moveTarea(id, estado, orden) {
  const payload = { estado };
  if (typeof orden === "number") payload.orden = orden;
  const { data } = await api.patch(`/kanban/tareas/${id}/move`, payload);
  return data;
}

// KPIs (existente)
export async function fetchKpis() {
  const { data } = await api.get("/kanban/kpis");
  return data;
}
