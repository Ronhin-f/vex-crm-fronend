import { api, unwrap } from "../lib/api";

export function listTareas({ org, cliente_id = "" } = {}) {
  const params = {};
  if (org) params.organizacion_id = org;
  if (cliente_id) params.cliente_id = cliente_id;
  return unwrap(api.get("/api/tareas", { params }));
}

export function createTarea(payload, org) {
  return unwrap(api.post("/api/tareas", { ...payload, ...(org ? { organizacion_id: org } : {}) }));
}

export function updateTarea(id, payload, org) {
  return unwrap(api.patch(`/api/tareas/${id}`, { ...payload, ...(org ? { organizacion_id: org } : {}) }));
}
