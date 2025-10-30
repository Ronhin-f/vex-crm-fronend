// src/features/pages/BillingPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import InvoiceFilters from "../billing/components/InvoiceFilters.jsx";
import InvoiceList from "../billing/components/InvoiceList.jsx";
import CreateInvoiceDialog from "../billing/components/CreateInvoiceDialog.jsx";

import {
  listInvoices,
  createInvoice,
  markAsPaid,
  removeInvoice,
} from "../billing/billing.api.js";

const DEFAULT_FILTERS = {
  q: "",
  qField: "number",
  due: "",
  dueFrom: "",
  dueTo: "",
  type: "",
};

export default function BillingPage() {
  const [tab, setTab] = useState("sent"); // "sent" | "received"
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const filterKey = useMemo(
    () => [filters.q, filters.qField, filters.due, filters.dueFrom, filters.dueTo, filters.type].join("|"),
    [filters]
  );

  async function fetchData() {
    setLoading(true);
    try {
      const data = await listInvoices({ kind: tab, ...filters, page: 1, pageSize: 20 });
      setRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (e) {
      console.error(e);
      setRows([]);
      toast.error("No se pudieron cargar las facturas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [tab, filterKey]);

  async function handleCreate(form) {
    try {
      await createInvoice({ kind: tab, ...form });
      toast.success("Factura creada");
      setOpenCreate(false);
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("Error al crear factura");
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header + CTA */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Facturación</h1>
        <button
          className="px-3 py-2 bg-black text-white rounded"
          onClick={() => setOpenCreate(true)}
        >
          + Crear factura
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`px-3 py-2 border rounded ${tab === "sent" ? "bg-gray-900 text-white" : ""}`}
          onClick={() => setTab("sent")}
        >
          Enviadas
        </button>
        <button
          className={`px-3 py-2 border rounded ${tab === "received" ? "bg-gray-900 text-white" : ""}`}
          onClick={() => setTab("received")}
        >
          Recibidas
        </button>
      </div>

      {/* Filtros */}
      <InvoiceFilters value={filters} onChange={setFilters} />

      {/* Lista / Loading */}
      {loading ? (
        <div className="border rounded p-4">
          <div className="skeleton h-10 w-full mb-2" />
          <div className="skeleton h-10 w-full mb-2" />
          <div className="skeleton h-10 w-full" />
        </div>
      ) : (
        <InvoiceList
          rows={rows}
          onView={(r) => console.log("ver", r)}
          onEdit={(r) => console.log("editar", r)}
          onMarkPaid={async (r) => {
            await markAsPaid(r.id);
            toast.success("Marcada como pagada");
            fetchData();
          }}
          onDelete={async (r) => {
            if (confirm("¿Eliminar factura?")) {
              await removeInvoice(r.id);
              toast.success("Eliminada");
              fetchData();
            }
          }}
        />
      )}

      {/* Crear */}
      <CreateInvoiceDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
