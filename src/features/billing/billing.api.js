// src/features/billing/services/billing.api.js
import api from "../../../utils/api.js";

// Listar facturas con filtros y paginación
export async function listInvoices({ kind, q, qField, due, dueFrom, dueTo, type, page = 1, pageSize = 20 }) {
  const { data } = await api.get("/api/billing/invoices", {
    params: { kind, q, qField, due, dueFrom, dueTo, type, page, pageSize },
  });
  return data; // { rows: [...], total: 123 }
}

// Crear nueva factura
export async function createInvoice(payload) {
  const { data } = await api.post("/api/billing/invoices", payload);
  return data;
}

// Acciones por factura
export async function markAsPaid(id) {
  const { data } = await api.patch(`/api/billing/invoices/${id}/paid`);
  return data;
}
export async function removeInvoice(id) {
  const { data } = await api.delete(`/api/billing/invoices/${id}`);
  return data;
}
