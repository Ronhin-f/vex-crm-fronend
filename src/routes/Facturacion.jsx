// src/routes/Facturacion.jsx
import { useState } from "react";
import { Plus } from "lucide-react";

const formatFecha = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Opciones de ejemplo para el dropdown de Cliente/Proveedor.
const CLIENTES_SUGERIDOS = [
  "Natalie Perez",
  "Juan Pérez",
  "Veterinaria Demo",
  "Proveedor Genérico",
];

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

  // Lista local de facturas (solo frontend por ahora)
  const [facturas, setFacturas] = useState([]);

  // Modo del modal: crear / editar (dejamos "view" por si se usa después, pero sin botón)
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [selectedFactura, setSelectedFactura] = useState(null);

  const [form, setForm] = useState({
    tipo: "B",
    numero: "",
    fecha: "",
    vencimiento: "",
    cliente: "",
    monto: "",
  });

  const handleFilterChange = (field) => (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      tipo: "B",
      numero: "",
      fecha: "",
      vencimiento: "",
      cliente: "",
      monto: "",
    });
  };

  const abrirModalCrear = () => {
    setModalMode("create");
    setSelectedFactura(null);
    resetForm();
    setShowModal(true);
  };

  const abrirModalEditar = (factura) => {
    setModalMode("edit");
    setSelectedFactura(factura);
    setForm({
      tipo: factura.tipo,
      numero: factura.numero,
      fecha: factura.fecha,
      vencimiento: factura.vencimiento,
      cliente: factura.cliente,
      monto:
        factura.total != null && !Number.isNaN(factura.total)
          ? String(factura.total)
          : "",
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setSelectedFactura(null);
    setModalMode("create");
    resetForm();
  };

  const eliminarFactura = (id) => {
    const ok = window.confirm("¿Seguro que querés eliminar esta factura?");
    if (!ok) return;
    setFacturas((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmitFactura = (e) => {
    e.preventDefault();

    // Validación mínima
    if (!form.numero || !form.fecha || !form.cliente) {
      alert("Completá Número, Fecha y Cliente/Proveedor antes de guardar.");
      return;
    }

    const total =
      form.monto && !Number.isNaN(Number(form.monto))
        ? parseFloat(form.monto)
        : 0;

    if (modalMode === "create") {
      const nueva = {
        id: Date.now(), // ID temporal local
        tipo: form.tipo,
        numero: form.numero,
        fecha: form.fecha,
        vencimiento: form.vencimiento,
        cliente: form.cliente,
        estado: "Pendiente",
        total,
      };

      setFacturas((prev) => [nueva, ...prev]);
    } else if (modalMode === "edit" && selectedFactura) {
      setFacturas((prev) =>
        prev.map((f) =>
          f.id === selectedFactura.id
            ? {
                ...f,
                tipo: form.tipo,
                numero: form.numero,
                fecha: form.fecha,
                vencimiento: form.vencimiento,
                cliente: form.cliente,
                total,
              }
            : f
        )
      );
    }

    cerrarModal();
  };

  const isReadOnly = false; // por ahora no hay modo "Ver"

  // (Opcional) todavía no filtramos la lista, pero dejamos el hook para después.
  const facturasFiltradas = facturas;

  return (
    <div className="h-full w-full p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Facturación</h1>

        <button
          type="button"
          onClick={abrirModalCrear}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>CREAR FACTURA</span>
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
          ENVIADAS
        </button>
        <button
          type="button"
          onClick={() => setTab("recibidas")}
          className={`btn btn-sm ${
            tab === "recibidas" ? "btn-primary" : "btn-ghost"
          }`}
        >
          RECIBIDAS
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

        {/* Vencimiento */}
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
              {facturasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-base-content/60"
                  >
                    Sin resultados
                  </td>
                </tr>
              ) : (
                facturasFiltradas.map((f) => (
                  <tr key={f.id}>
                    <td>{formatFecha(f.fecha)}</td>
                    <td>{f.numero}</td>
                    <td>{f.cliente}</td>
                    <td>{f.tipo}</td>
                    <td>{formatFecha(f.vencimiento)}</td>
                    <td>{f.estado}</td>
                    <td className="text-right">
                      {f.total != null ? f.total.toFixed(2) : "-"}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {/* VER eliminado, quedan solo editar y eliminar */}
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => abrirModalEditar(f)}
                        >
                          EDITAR
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => eliminarFactura(f.id)}
                        >
                          ELIMINAR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva / Editar factura */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-xl p-6 shadow-xl invoice-modal w-full max-w-lg">
            <h3 className="invoice-modal-header text-lg font-semibold">
              {modalMode === "edit" ? "Editar factura" : "Nueva factura"}
            </h3>

            <form onSubmit={handleSubmitFactura} className="space-y-4">
              <div className="invoice-modal-grid">
                {/* Tipo */}
                <div>
                  <label className="block mb-1 text-sm font-medium">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={handleFormChange("tipo")}
                    className="invoice-field"
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
                  />
                </div>

                {/* Cliente / Proveedor */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Cliente/Proveedor
                  </label>
                  <input
                    type="text"
                    value={form.cliente}
                    onChange={handleFormChange("cliente")}
                    className="invoice-field"
                    disabled={isReadOnly}
                    list="clientes-sugeridos"
                    placeholder="Seleccionar o escribir nombre..."
                  />
                  <datalist id="clientes-sugeridos">
                    {CLIENTES_SUGERIDOS.map((nombre) => (
                      <option key={nombre} value={nombre} />
                    ))}
                  </datalist>
                </div>

                {/* Monto */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.monto}
                    onChange={handleFormChange("monto")}
                    className="invoice-field"
                    disabled={isReadOnly}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="btn btn-ghost"
                >
                  CANCELAR
                </button>

                {!isReadOnly && (
                  <button type="submit" className="btn btn-primary">
                    {modalMode === "edit" ? "GUARDAR" : "CREAR"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
