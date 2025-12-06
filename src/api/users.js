import { api, unwrap } from "../lib/api";
export const getUsuarios = (org) =>
  unwrap(api.get("/usuarios", { params: org ? { organizacion_id: org } : {} }));
