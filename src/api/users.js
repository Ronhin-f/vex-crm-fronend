import { api, unwrap } from "../lib/api";
export const getUsuarios = (org) =>
  unwrap(api.get("/api/usuarios", { params: org ? { organizacion_id: org } : {} }));
