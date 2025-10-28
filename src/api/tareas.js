import { api, unwrap } from "../lib/api";

export function listTareas({ org = 10, cliente_id = "" } = {}) {
  const params = { org };
  if (cliente_id) params.cliente_id = cliente_id;
  return unwrap(api.get("/api/tareas", { params }));
}

export function createTarea(payload, org = 10) {
  return unwrap(api.post("/api/tareas", { ...payload, organizacion_id: org }));
}

export function updateTarea(id, payload, org = 10) {
  return unwrap(api.patch(`/api/tareas/${id}`, { ...payload, organizacion_id: org }));
}
