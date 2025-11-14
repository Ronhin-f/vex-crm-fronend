// src/routes/Facturacion.jsx
import { useState } from "react";
import { Plus } from "lucide-react";

export default function Facturacion() {
  const [tab, setTab] = useState("enviadas");
  const [showModal, setShowModal] = useState(false);

  const [filters, setFilters] = useState({
    numeroTipo: "",
    busqueda: "",
    vencimiento: "",
    fechaDesde: "",
    fechaHasta: "",
    tipo: "",
  });

  const [form, setForm] = useState({
    tipo: "B",
    numero: "",
    fecha: "",
    vencimiento: "",
    cliente: "",
  });

  const handleFilterChange = (field) => (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCrearFactura = (e) => {
    e.preventDefault();
    // Acá después se conecta con el backend (POST factura).
    console.log("Crear factura:", form);

    // Por ahora solo cerramos y reseteamos.
    setForm({
      tipo: "B",
      numero: "",
      fecha: "",
      vencimiento: "",
      cliente: "",
    });
    setShowModal(false);
  };

  return (
    <div className="h-full w-full p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Facturación</h1>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Crear factura</span>
        </button>
      </div>

      {/* Tabs Enviadas / Recibidas */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("enviadas")}
          className={`btn btn-sm ${
            tab === "enviadas" ? "btn-primary" : "btn-ghost"
          }`}
        >
          Enviadas
        </button>
        <button
          type="button"
          onClick={() => setTab("recibidas")}
          className={`btn btn-sm ${
            tab === "recibidas" ? "btn-primary" : "btn-ghost"
          }`}
        >
          Recibidas
        </button>
      </div>

      {/* Filtros */}
      <div className="invoice-filter-row mt-2">
        {/* Número */}
        <select
          value={filters.numeroTipo}
          onChange={handleFilterChange("numeroTipo")}
          className="invoice-field"
        >
          <option value="">Número</option>
          <option value="A">Factura A</option>
          <option value="B">Factura B</option>
          <option value="C">Factura C</option>
        </select>

        {/* Buscar */}
        <input
          type="text"
          value={filters.busqueda}
          onChange={handleFilterChange("busqueda")}
          placeholder="Buscar..."
          className="invoice-field"
        />

        {/* Vencimiento: Todos / Vencidas / Al día */}
        <select
          value={filters.vencimiento}
          onChange={handleFilterChange("vencimiento")}
          className="invoice-field"
        >
          <option value="">Vencimiento: Todos</option>
          <option value="vencidas">Solo vencidas</option>
          <option value="aldia">Al día</option>
        </select>

        {/* Fecha desde */}
        <input
          type="date"
          value={filters.fechaDesde}
          onChange={handleFilterChange("fechaDesde")}
          className="invoice-field"
        />

        {/* Fecha hasta */}
        <input
          type="date"
          value={filters.fechaHasta}
          onChange={handleFilterChange("fechaHasta")}
          className="invoice-field"
        />
      </div>

      {/* Tabla de resultados */}
      <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-base-300 bg-base-100">
        <div className="overflow-x-auto h-full">
          <table className="table table-zebra table-sm w-full">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Número</th>
                <th>Cliente/Proveedor</th>
                <th>Tipo</th>
                <th>Vence</th>
                <th>Estado</th>
                <th className="text-right">Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Por ahora sin datos; después se mapea la lista real de facturas */}
              <tr>
                <td colSpan={8} className="text-center py-8 text-base-content/60">
                  Sin resultados
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva factura */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-xl p-6 shadow-xl invoice-modal w-full max-w-lg">
            <h3 className="invoice-modal-header text-lg font-semibold">
              Nueva factura
            </h3>

            <form onSubmit={handleCrearFactura} className="space-y-4">
              <div className="invoice-modal-grid">
                {/* Tipo */}
                <div>
                  <label className="block mb-1 text-sm font-medium">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={handleFormChange("tipo")}
                    className="invoice-field"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                {/* Número */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Número
                  </label>
                  <input
                    type="text"
                    value={form.numero}
                    onChange={handleFormChange("numero")}
                    className="invoice-field"
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={handleFormChange("fecha")}
                    className="invoice-field"
                  />
                </div>

                {/* Vencimiento */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Vencimiento
                  </label>
                  <input
                    type="date"
                    value={form.vencimiento}
                    onChange={handleFormChange("vencimiento")}
                    className="invoice-field"
                  />
                </div>

                {/* Cliente / Proveedor */}
                <div className="invoice-modal-grid-full">
                  <label className="block mb-1 text-sm font-medium">
                    Cliente/Proveedor
                  </label>
                  <input
                    type="text"
                    value={form.cliente}
                    onChange={handleFormChange("cliente")}
                    className="invoice-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
