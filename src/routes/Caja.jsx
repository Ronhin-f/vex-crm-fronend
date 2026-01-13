// src/routes/Caja.jsx
import { useEffect, useMemo, useState } from "react";
import { Lock, Plus, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../utils/api";

const DENOMINACIONES = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

const formatFechaHora = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("es-AR");
  } catch {
    return String(iso);
  }
};

const formatMoney = (n) => {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
};

export default function Caja() {
  const [loading, setLoading] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cajas, setCajas] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);

  const [formOpen, setFormOpen] = useState({
    almacen_id: "",
    apertura_monto: "0",
    notas: "",
  });

  const [formClose, setFormClose] = useState({
    cierre_monto: "",
    notas: "",
  });

  const [arqueo, setArqueo] = useState(() =>
    DENOMINACIONES.reduce((acc, d) => ({ ...acc, [d]: "" }), {})
  );

  const arqueoTotal = useMemo(() => {
    return DENOMINACIONES.reduce((acc, d) => {
      const qty = Number(arqueo[d] || 0);
      if (Number.isFinite(qty)) return acc + d * qty;
      return acc;
    }, 0);
  }, [arqueo]);

  const loadAbierta = async () => {
    const res = await api.get("/caja", {
      params: { estado: "abierta", page: 1, pageSize: 1 },
    });
    const rows = Array.isArray(res.data?.rows) ? res.data.rows : [];
    setAbierta(rows[0] || null);
  };

  const loadCajas = async () => {
    const res = await api.get("/caja", { params: { page: 1, pageSize: 20 } });
    const rows = Array.isArray(res.data?.rows) ? res.data.rows : [];
    setCajas(rows);
  };

  const loadDetalle = async (id) => {
    const res = await api.get(`/caja/${id}`);
    setDetalle(res.data || null);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadAbierta(), loadCajas()]);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cargar Caja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (abierta?.id) {
      loadDetalle(abierta.id).catch(() => {});
    } else {
      setDetalle(null);
    }
  }, [abierta?.id]);

  const handleOpenChange = (field) => (e) => {
    const value = e.target.value;
    setFormOpen((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseChange = (field) => (e) => {
    const value = e.target.value;
    setFormClose((prev) => ({ ...prev, [field]: value }));
  };

  const handleArqueoChange = (denom) => (e) => {
    const value = e.target.value;
    setArqueo((prev) => ({ ...prev, [denom]: value }));
  };

  const resetOpenForm = () => {
    setFormOpen({ almacen_id: "", apertura_monto: "0", notas: "" });
  };

  const resetCloseForm = () => {
    setFormClose({ cierre_monto: "", notas: "" });
    setArqueo(DENOMINACIONES.reduce((acc, d) => ({ ...acc, [d]: "" }), {}));
  };

  const abrirCaja = async () => {
    const almacenId = Number(formOpen.almacen_id);
    if (!Number.isFinite(almacenId)) {
      toast.error("almacen_id requerido");
      return;
    }

    const apertura = Number(formOpen.apertura_monto || 0);

    try {
      await api.post("/caja", {
        almacen_id: almacenId,
        apertura_monto: Number.isFinite(apertura) ? apertura : 0,
        notas: formOpen.notas || null,
      });
      toast.success("Caja abierta");
      setOpenModal(false);
      resetOpenForm();
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo abrir la caja");
    }
  };

  const cerrarCaja = async () => {
    if (!abierta?.id) return;

    const cierreInput = formClose.cierre_monto;
    const cierreMonto = cierreInput ? Number(cierreInput) : arqueoTotal;
    if (!Number.isFinite(cierreMonto)) {
      toast.error("cierre_monto requerido");
      return;
    }

    const arqueoDetalle = DENOMINACIONES.map((d) => ({
      denominacion: d,
      cantidad: Number(arqueo[d] || 0),
    })).filter((row) => row.cantidad > 0);

    try {
      await api.post(`/caja/${abierta.id}/cerrar`, {
        cierre_monto: cierreMonto,
        arqueo_detalle: arqueoDetalle,
        notas: formClose.notas || null,
      });
      toast.success("Caja cerrada");
      setCloseModal(false);
      resetCloseForm();
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cerrar la caja");
    }
  };

  const cobros = Array.isArray(detalle?.cobros) ? detalle.cobros : [];

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Caja</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={loadAll}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          {!abierta && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setOpenModal(true)}
            >
              <Plus className="w-4 h-4" />
              Abrir caja
            </button>
          )}
          {abierta && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCloseModal(true)}
            >
              <Lock className="w-4 h-4" />
              Cerrar caja
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-base-300 bg-base-100 p-4">
          <div className="text-xs uppercase opacity-60">Estado</div>
          <div className="text-lg font-semibold">
            {abierta ? "Abierta" : "Sin caja abierta"}
          </div>
          <div className="text-sm opacity-70 mt-1">
            {abierta ? `Almacen #${abierta.almacen_id}` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-base-300 bg-base-100 p-4">
          <div className="text-xs uppercase opacity-60">Apertura</div>
          <div className="text-lg font-semibold">${formatMoney(detalle?.apertura_monto)}</div>
          <div className="text-sm opacity-70 mt-1">
            {formatFechaHora(detalle?.apertura_at || detalle?.created_at)}
          </div>
        </div>
        <div className="rounded-xl border border-base-300 bg-base-100 p-4">
          <div className="text-xs uppercase opacity-60">Cobros confirmados</div>
          <div className="text-lg font-semibold">${formatMoney(detalle?.cobros_total)}</div>
          <div className="text-sm opacity-70 mt-1">
            {detalle?.cobros_count || 0} cobros
          </div>
        </div>
        <div className="rounded-xl border border-base-300 bg-base-100 p-4">
          <div className="text-xs uppercase opacity-60">Esperado</div>
          <div className="text-lg font-semibold">${formatMoney(detalle?.cierre_total_esperado)}</div>
          <div className="text-sm opacity-70 mt-1">
            Diferencia: {formatMoney(detalle?.cierre_diferencia)}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Cobros en caja</h2>
        <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
          <table className="table table-zebra table-sm w-full">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Medio</th>
                <th>Estado</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-base-content/60">
                    Cargando cobros...
                  </td>
                </tr>
              ) : cobros.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-base-content/60">
                    Sin cobros en esta caja
                  </td>
                </tr>
              ) : (
                cobros.map((c) => (
                  <tr key={c.id}>
                    <td>{formatFechaHora(c.created_at)}</td>
                    <td>{c.cliente_id || "-"}</td>
                    <td>{c.medio_pago || "-"}</td>
                    <td>{c.estado}</td>
                    <td className="text-right">${formatMoney(c.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Ultimos cierres</h2>
        <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
          <table className="table table-zebra table-sm w-full">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Almacen</th>
                <th className="text-right">Apertura</th>
                <th className="text-right">Cierre</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-base-content/60">
                    Cargando cajas...
                  </td>
                </tr>
              ) : cajas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-base-content/60">
                    Sin historial
                  </td>
                </tr>
              ) : (
                cajas.map((c) => (
                  <tr key={c.id}>
                    <td>{formatFechaHora(c.created_at)}</td>
                    <td>{c.estado}</td>
                    <td>{c.almacen_id}</td>
                    <td className="text-right">${formatMoney(c.apertura_monto)}</td>
                    <td className="text-right">${formatMoney(c.cierre_monto)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-xl p-6 shadow-xl w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Abrir caja</h3>
            <div className="grid gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Almacen</label>
                <input
                  type="number"
                  min="1"
                  value={formOpen.almacen_id}
                  onChange={handleOpenChange("almacen_id")}
                  className="input input-bordered w-full"
                  placeholder="ID de almacen"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Monto apertura</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formOpen.apertura_monto}
                  onChange={handleOpenChange("apertura_monto")}
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Notas</label>
                <textarea
                  value={formOpen.notas}
                  onChange={handleOpenChange("notas")}
                  className="textarea textarea-bordered w-full"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setOpenModal(false);
                  resetOpenForm();
                }}
              >
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={abrirCaja}>
                Abrir
              </button>
            </div>
          </div>
        </div>
      )}

      {closeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-xl p-6 shadow-xl w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Cerrar caja</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Monto cierre</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formClose.cierre_monto}
                  onChange={handleCloseChange("cierre_monto")}
                  className="input input-bordered w-full"
                  placeholder={`Sugerido: ${formatMoney(arqueoTotal)}`}
                />
                <div className="text-xs opacity-60 mt-1">
                  Si no completas, usamos el total del arqueo.
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Notas</label>
                <textarea
                  value={formClose.notas}
                  onChange={handleCloseChange("notas")}
                  className="textarea textarea-bordered w-full"
                  rows={4}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Arqueo por denominacion</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DENOMINACIONES.map((d) => (
                  <div key={d} className="flex items-center gap-2">
                    <span className="w-16 text-sm">${d}</span>
                    <input
                      type="number"
                      min="0"
                      value={arqueo[d]}
                      onChange={handleArqueoChange(d)}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm">
                Total arqueo: <span className="font-semibold">${formatMoney(arqueoTotal)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setCloseModal(false);
                  resetCloseForm();
                }}
              >
                Cancelar
              </button>
              <button type="button" className="btn btn-secondary" onClick={cerrarCaja}>
                Cerrar caja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
