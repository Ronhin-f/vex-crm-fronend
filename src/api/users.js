import { api, unwrap } from "../lib/api";
export const getUsuarios = (org = 10) =>
  unwrap(api.get("/api/usuarios", { params: { org } }));
