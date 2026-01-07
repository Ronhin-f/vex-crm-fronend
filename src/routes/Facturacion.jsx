// src/routes/Facturacion.jsx
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../utils/api";

const formatFecha = (iso) => {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
};

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

  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);

  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [selectedFactura, setSelectedFactura] = useState(null);

  const [form, setForm] = useState({
    tipo: "B",
    numero: "",
    fecha: "",
    vencimiento: "",
    cliente_id: "",
    monto: "",
  });

  const filterKey = useMemo(
    () =>
      [
        tab,
        filters.numeroTipo,
        filters.busqueda,
        filters.vencimiento,
        filters.fechaDesde,
        filters.fechaHasta,
        filters.tipo,
      ].join("|"),
    [tab, filters]
  );

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
      cliente_id: "",
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
      tipo: factura.tipo || "B",
      numero: factura.numero || "",
      fecha: factura.fecha || "",
      vencimiento: factura.vencimiento || "",
      cliente_id: factura.client_id ? String(factura.client_id) : "",
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
    const ok = window.confirm("Seguro que queres eliminar esta factura?");
    if (!ok) return;
    api
      .delete(`/api/billing/invoices/${id}`)
      .then(() => {
        toast.success("Factura eliminada");
        loadFacturas();
      })
      .catch((e) => {
        console.error(e);
        toast.error("No se pudo eliminar la factura");
      });
  };

  const handleSubmitFactura = async (e) => {
    e.preventDefault();

    if (!form.numero || !form.fecha || !form.cliente_id) {
      toast.error("Completa Numero, Fecha y Cliente/Proveedor antes de guardar.");
      return;
    }

    const total =
      form.monto && !Number.isNaN(Number(form.monto))
        ? parseFloat(form.monto)
        : 0;

    const payload = {
      client_id: Number(form.cliente_id),
      number: form.numero,
      date: form.fecha,
      dueDate: form.vencimiento,
      amount_subtotal: total,
      amount_total: total,
      amount_tax: 0,
      amount_paid: 0,
      status: "sent",
    };

    try {
      if (modalMode === "create") {
        await api.post("/api/billing/invoices", payload);
        toast.success("Factura creada");
      } else if (modalMode === "edit" && selectedFactura) {
        await api.patch(`/api/billing/invoices/${selectedFactura.id}`, payload);
        toast.success("Factura actualizada");
      }
      cerrarModal();
      loadFacturas();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar la factura");
    }
  };

  const isReadOnly = false;

  function mapFacturaRow(row) {
    return {
      id: row.id,
      numero: row.number || "",
      fecha: row.date || "",
      vencimiento: row.dueDate || "",
      cliente: row.party || "",
      tipo: row.type || "",
      estado: row.status || "",
      total: row.total ?? 0,
      client_id: row.client_id,
    };
  }

  function loadClientes() {
    setLoadingClientes(true);
    api
      .get("/clientes")
      .then((res) => {
        setClientes(Array.isArray(res.data) ? res.data : []);
      })
      .catch((e) => {
        console.warn("No pude cargar clientes", e);
        setClientes([]);
      })
      .finally(() => setLoadingClientes(false));
  }

  function loadFacturas() {
    setLoading(true);
    api
      .get("/api/billing/invoices", {
        params: {
          kind: tab,
          q: filters.busqueda,
          qField: "number",
          due: filters.vencimiento,
          dueFrom: filters.fechaDesde,
          dueTo: filters.fechaHasta,
          type: filters.tipo || filters.numeroTipo,
          page: 1,
          pageSize: 50,
        },
      })
      .then((res) => {
        const rows = Array.isArray(res.data?.rows) ? res.data.rows : [];
        setFacturas(rows.map(mapFacturaRow));
      })
      .catch((e) => {
        console.warn("No pude cargar facturas", e);
        setFacturas([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    loadFacturas();
  }, [filterKey]);

  const facturasFiltradas = facturas;

  const handleVerFacturaDigital = (factura) => {
    alert(
      `Ver factura digital\n\nNumero: ${factura.numero}\nCliente: ${factura.cliente}`
    );
  };

  return (
    <div className="h-full w-full p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Facturacion</h1>

        <button
          type="button"
          onClick={abrirModalCrear}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>CREAR FACTURA</span>
        </button>
      </div>

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

      <div className="invoice-filter-row mt-2">
        <select
          value={filters.numeroTipo}
          onChange={handleFilterChange("numeroTipo")}
          className="invoice-field"
        >
          <option value="">Numero</option>
          <option value="A">Factura A</option>
          <option value="B">Factura B</option>
          <option value="C">Factura C</option>
        </select>

        <input
          type="text"
          value={filters.busqueda}
          onChange={handleFilterChange("busqueda")}
          placeholder="Buscar..."
          className="invoice-field"
        />

        <select
          value={filters.vencimiento}
          onChange={handleFilterChange("vencimiento")}
          className="invoice-field"
        >
          <option value="">Vencimiento: Todos</option>
          <option value="vencidas">Solo vencidas</option>
          <option value="aldia">Al dia</option>
        </select>

        <input
          type="date"
          value={filters.fechaDesde}
          onChange={handleFilterChange("fechaDesde")}
          className="invoice-field"
        />

        <input
          type="date"
          value={filters.fechaHasta}
          onChange={handleFilterChange("fechaHasta")}
          className="invoice-field"
        />
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-base-300 bg-base-100">
        <div className="overflow-x-auto h-full">
          <table className="table table-zebra table-sm w-full">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Numero</th>
                <th>Cliente/Proveedor</th>
                <th>Tipo</th>
                <th>Vence</th>
                <th>Estado</th>
                <th className="text-right">Total</th>
                <th>Acciones</th>
                <th>Factura digital</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-base-content/60">
                    Cargando facturas...
                  </td>
                </tr>
              ) : facturasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
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
                    <td>{f.cliente || "-"}</td>
                    <td>{f.tipo || "-"}</td>
                    <td>{formatFecha(f.vencimiento)}</td>
                    <td>{f.estado || "-"}</td>
                    <td className="text-right">
                      {f.total != null ? f.total.toFixed(2) : "-"}
                    </td>
                    <td>
                      <div className="flex gap-1">
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
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => handleVerFacturaDigital(f)}
                      >
                        Ver factura digital
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-xl p-6 shadow-xl invoice-modal w-full max-w-lg">
            <h3 className="invoice-modal-header text-lg font-semibold">
              {modalMode === "edit" ? "Editar factura" : "Nueva factura"}
            </h3>

            <form onSubmit={handleSubmitFactura} className="space-y-4">
              <div className="invoice-modal-grid">
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

                <div>
                  <label className="block mb-1 text-sm font-medium">Numero</label>
                  <input
                    type="text"
                    value={form.numero}
                    onChange={handleFormChange("numero")}
                    className="invoice-field"
                    disabled={isReadOnly}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={handleFormChange("fecha")}
                    className="invoice-field"
                    disabled={isReadOnly}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Vencimiento</label>
                  <input
                    type="date"
                    value={form.vencimiento}
                    onChange={handleFormChange("vencimiento")}
                    className="invoice-field"
                    disabled={isReadOnly}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Cliente/Proveedor
                  </label>
                  <select
                    value={form.cliente_id}
                    onChange={handleFormChange("cliente_id")}
                    className="invoice-field"
                    disabled={isReadOnly || loadingClientes}
                  >
                    <option value="">
                      {loadingClientes ? "Cargando clientes..." : "Seleccionar cliente"}
                    </option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Monto</label>
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
