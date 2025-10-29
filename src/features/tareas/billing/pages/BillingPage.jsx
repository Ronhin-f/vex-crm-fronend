// src/features/billing/pages/BillingPage.jsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import InvoiceFilters from "../components/InvoiceFilters";
import InvoiceList from "../components/InvoiceList";
import CreateInvoiceDialog from "../components/CreateInvoiceDialog";
import { listInvoices, createInvoice, markAsPaid, removeInvoice } from "../services/billing.api";

const DEFAULT_FILTERS = { q: "", qField: "number", due: "", dueFrom: "", dueTo: "", type: "" };

export default function BillingPage() {
  const [tab, setTab] = useState("sent"); // "sent" | "received"
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [rows, setRows] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);

  async function fetchData() {
    try {
      const data = await listInvoices({ kind: tab, ...filters, page: 1, pageSize: 20 });
      setRows(data.rows || []);
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron cargar las facturas");
    }
  }

  useEffect(() => { fetchData(); }, [tab, JSON.stringify(filters)]);

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
        <button className="px-3 py-2 bg-black text-white rounded" onClick={() => setOpenCreate(true)}>
          + Crear factura
        </button>
      </div>

      {/* Tabs: Enviadas / Recibidas */}
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

      {/* Filtros (buscador con dropdown, vencimiento, tipo) */}
      <InvoiceFilters value={filters} onChange={setFilters} />

      {/* Listado con dropdown por fila */}
      <InvoiceList
        rows={rows}
        onView={(r) => console.log("ver", r)}
        onEdit={(r) => console.log("editar", r)}
        onMarkPaid={async (r) => { await markAsPaid(r.id); toast.success("Marcada como pagada"); fetchData(); }}
        onDelete={async (r) => { if (confirm("¿Eliminar factura?")) { await removeInvoice(r.id); toast.success("Eliminada"); fetchData(); } }}
      />

      {/* Diálogo crear */}
      <CreateInvoiceDialog open={openCreate} onClose={() => setOpenCreate(false)} onSubmit={handleCreate} />
    </div>
  );
}
