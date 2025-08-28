// src/routes/Compras.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import { Plus, Edit2, Trash2, Check, X, Package, Calendar } from "lucide-react";

function EstadoBadge({ estado }) {
  const map = {
    pendiente: "badge-warning",
    submitted: "badge-info",
    received: "badge-success",
    cancelled: "badge-ghost",
  };
  const cls = map[String(estado || "").toLowerCase()] || "badge-ghost";
  return <span className={`badge ${cls} badge-outline`}>{estado || "—"}</span>;
}

export default function Compras() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ producto: "", cantidad: 1, observacion: "" });

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ producto: "", cantidad: 1, observacion: "" });

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/compras");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("No pude cargar compras");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onAdd(e) {
    e?.preventDefault?.();
    const producto = form.producto?.trim();
    const cantidad = Number.isFinite(+form.cantidad) ? Math.max(1, parseInt(form.cantidad, 10)) : 1;
    const observacion = form.observacion?.trim() || null;
    if (!producto) return toast.error("Producto requerido");
    try {
      const { data } = await api.post("/compras", { producto, cantidad, observacion });
      setItems((prev) => [data, ...prev]);
      setForm({ producto: "", cantidad: 1, observacion: "" });
      toast.success("Item agregado");
    } catch (e) {
      console.error(e);
      toast.error("No pude agregar el item");
    }
  }

  function startEdit(it) {
    setEditingId(it.id);
    setDraft({
      producto: it.producto || "",
      cantidad: it.cantidad ?? 1,
      observacion: it.observacion || "",
    });
  }

  async function saveEdit(id) {
    const payload = {};
    if (draft.producto?.trim() !== "") payload.producto = draft.producto.trim();
    if (Number.isFinite(+draft.cantidad)) payload.cantidad = Math.max(1, parseInt(draft.cantidad, 10));
    payload.observacion = draft.observacion?.trim() || null;

    if (!Object.keys(payload).length) {
      setEditingId(null);
      return;
    }
    try {
      const { data } = await api.patch(`/compras/${id}`, payload);
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...data } : x)));
      setEditingId(null);
      toast.success("Item actualizado");
    } catch (e) {
      console.error(e);
      toast.error("No pude actualizar el item");
    }
  }

  async function remove(id) {
    if (!confirm("¿Eliminar item?")) return;
    try {
      await api.delete(`/compras/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success("Item eliminado");
    } catch (e) {
      console.error(e);
      toast.error("No pude eliminar el item");
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Compras</h1>

      {/* Alta rápida */}
      <form onSubmit={onAdd} className="card bg-base-100 shadow mb-6">
        <div className="card-body grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <label className="label">Producto *</label>
            <input
              className="input input-bordered w-full"
              value={form.producto}
              onChange={(e) => setForm((f) => ({ ...f, producto: e.target.value }))}
              placeholder="Ej: Tornillos M6 x100"
            />
          </div>
          <div>
            <label className="label">Cantidad</label>
            <input
              type="number"
              min={1}
              className="input input-bordered w-full"
              value={form.cantidad}
              onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Observación</label>
            <input
              className="input input-bordered w-full"
              value={form.observacion}
              onChange={(e) => setForm((f) => ({ ...f, observacion: e.target.value }))}
              placeholder="Proveedor sugerido, variantes, etc."
            />
          </div>
          <div className="md:col-span-6">
            <button className="btn btn-primary">
              <Plus size={16} />
              Agregar a la lista
            </button>
          </div>
        </div>
      </form>

      {/* Lista */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-0 overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th className="w-1/3">Producto</th>
                <th>Cant.</th>
                <th>Obs.</th>
                <th className="whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Package size={14} /> Pedido
                  </div>
                </th>
                <th>Estado</th>
                <th className="whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} /> Fecha
                  </div>
                </th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}>
                      <div className="skeleton h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="p-6 text-sm opacity-70">No hay items de compras.</div>
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const fecha = it.fecha ? new Date(it.fecha) : null;
                  const isEditing = editingId === it.id;
                  return (
                    <tr key={it.id}>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input-bordered input-sm w-full"
                            value={draft.producto}
                            onChange={(e) => setDraft((d) => ({ ...d, producto: e.target.value }))}
                          />
                        ) : (
                          <div className="truncate">{it.producto}</div>
                        )}
                      </td>
                      <td className="w-24">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            className="input input-bordered input-sm w-full"
                            value={draft.cantidad}
                            onChange={(e) => setDraft((d) => ({ ...d, cantidad: e.target.value }))}
                          />
                        ) : (
                          it.cantidad ?? 1
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input-bordered input-sm w-full"
                            value={draft.observacion}
                            onChange={(e) => setDraft((d) => ({ ...d, observacion: e.target.value }))}
                          />
                        ) : (
                          <div className="truncate">{it.observacion || "—"}</div>
                        )}
                      </td>
                      <td>#{it.pedido_id || "—"}</td>
                      <td>
                        <EstadoBadge estado={it.estado} />
                      </td>
                      <td>{fecha ? fecha.toLocaleDateString() : "—"}</td>
                      <td className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <button className="btn btn-ghost btn-xs" onClick={() => saveEdit(it.id)} title="Guardar">
                              <Check size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => {
                                setEditingId(null);
                              }}
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <button className="btn btn-ghost btn-xs" onClick={() => startEdit(it)} title="Editar">
                              <Edit2 size={14} />
                            </button>
                            <button className="btn btn-ghost btn-xs text-error" onClick={() => remove(it.id)} title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
