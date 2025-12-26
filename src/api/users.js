// src/api/users.js
import api from "../utils/api";

export async function getUsuarios(org) {
  const params = org ? { organizacion_id: org } : {};
  const { data } = await api.get("/usuarios", { params });
  return data;
}
