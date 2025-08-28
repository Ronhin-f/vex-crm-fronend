// src/routes/Tareas.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import { Plus, Edit2, Trash2, Check, X, Calendar, User2 } from "lucide-react";

function EstadoBadge({ estado }) {
  const map = { todo: "badge-ghost", doing: "badge-info", waiting: "badge-warning", done: "badge-success" };
  return <span className={`badge ${map[estado] || "badge-ghost"} badge-outline`}>{estado || "todo"}</span>;
}

export default function Tareas() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ titulo: "", descripcion: "", cliente_id: "", vence_en: "" });

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ titulo: "", descripcion: "", cliente_id: "", vence_en: "" });

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/tareas");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("No pude cargar tareas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ---- Alta ----
  async function onAdd(e) {
    e?.preventDefault?.();
    const titulo = form.titulo?.trim();
    if (!titulo) return toast.error("Título requerido");
    const payload = {
      titulo,
      descripcion: form.descripcion?.trim() || null,
      cliente_id: form.cliente_id ? Number(form.cliente_id) : null,
      vence_en: form.vence_en ? new Date(form.vence_en).toISOString() : null,
      completada: false,
    };
    try {
      await api.post("/tareas", payload);
      setForm({ titulo: "", descripcion: "", cliente_id: "", vence_en: "" });
      toast.success("Tarea creada");
      load();
    } catch (e) {
      console.error(e);
      toast.error("No pude crear la tarea");
    }
  }

  function startEdit(it) {
    setEditingId(it.id);
    setDraft({
      titulo: it.titulo || "",
      descripcion: it.descripcion || "",
      cliente_id: it.cliente_id || "",
      vence_en: it.vence_en ? new Date(it.vence_en).toISOString().slice(0, 16) : "",
    });
  }

  async function saveEdit(id) {
    const payload = {
      titulo: draft.titulo?.trim() || null,
      descripcion: draft.descripcion?.trim() || null,
      cliente_id: draft.cliente_id ? Number(draft.cliente_id) : null,
      vence_en: draft.vence_en ? new Date(draft.vence_en).toISOString() : null,
    };
    try {
      await api.put(`/tareas/${id}`, payload);
      setEditingId(null);
      toast.success("Tarea actualizada");
      load();
    } catch (e) {
      console.error(e);
      toast.error("No pude actualizar la tarea");
    }
  }

  // ---- Completar / Reabrir ----
  async function markDone(id) {
    try {
      await api.patch(`/tareas/${id}`);
      toast.success("Marcada como hecha");
      load();
    } catch (e) {
      console.error(e);
      toast.error("No pude completar la tarea");
    }
  }

  async function reopen(id) {
    try {
      await api.put(`/tareas/${id}`, { completada: false, estado: "todo" });
      toast.success("Tarea reabierta");
      load();
    } catch (e) {
      console.error(e);
      toast.error("No pude reabrir la tarea");
    }
  }

  // ---- Eliminar ----
  async function remove(id) {
    if (!confirm("¿Eliminar tarea?")) return;
    try {
      await api.delete(`/tareas/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success("Tarea eliminada");
    } catch (e) {
      console.error(e);
      toast.error("No pude eliminar la tarea");
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Tareas</h1>

      {/* Alta rápida */}
      <form onSubmit={onAdd} className="card bg-base-100 shadow mb-6">
        <div className="card-body grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <label className="label">Título *</label>
            <input
              className="input input-bordered w-full"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Llamar a Juan por presupuesto"
            />
          </div>
          <div className="md:col-span-3">
            <label className="label">Descripción</label>
            <input
              className="input input-bordered w-full"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Cliente ID</label>
            <input
              type="number"
              min={1}
              className="input input-bordered w-full"
              value={form.cliente_id}
              onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value }))}
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="label">Vence en</label>
            <input
              type="datetime-local"
              className="input input-bordered w-full"
              value={form.vence_en}
              onChange={(e) => setForm((f) => ({ ...f, vence_en: e.target.value }))}
            />
          </div>
          <div className="md:col-span-6">
            <button className="btn btn-primary">
              <Plus size={16} />
              Agregar tarea
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
                <th>Título</th>
                <th>Cliente</th>
                <th>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} /> Vence
                  </div>
                </th>
                <th>Estado</th>
                <th>
                  <div className="flex items-center gap-1">
                    <User2 size={14} /> Asignada
                  </div>
                </th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <div className="skeleton h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="p-6 text-sm opacity-70">No hay tareas.</div>
                  </td>
                </tr>
              ) : (
                items.map((t) => {
                  const due = t.vence_en ? new Date(t.vence_en) : null;
                  const isEditing = editingId === t.id;
                  return (
                    <tr key={t.id} className={t.completada ? "opacity-60" : ""}>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input-bordered input-sm w-full"
                            value={draft.titulo}
                            onChange={(e) => setDraft((d) => ({ ...d, titulo: e.target.value }))}
                          />
                        ) : (
                          <div className="font-medium">{t.titulo}</div>
                        )}
                        <div className="text-xs opacity-70">
                          {isEditing ? (
                            <input
                              className="input input-bordered input-xs w-full mt-1"
                              value={draft.descripcion}
                              onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))}
                              placeholder="Descripción"
                            />
                          ) : (
                            t.descripcion || "—"
                          )}
                        </div>
                      </td>
                      <td className="w-40">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            className="input input-bordered input-sm w-full"
                            value={draft.cliente_id}
                            onChange={(e) => setDraft((d) => ({ ...d, cliente_id: e.target.value }))}
                          />
                        ) : (
                          <div className="truncate">{t.cliente_nombre || (t.cliente_id ? `#${t.cliente_id}` : "—")}</div>
                        )}
                      </td>
                      <td className="w-56">
                        {isEditing ? (
                          <input
                            type="datetime-local"
                            className="input input-bordered input-sm w-full"
                            value={draft.vence_en}
                            onChange={(e) => setDraft((d) => ({ ...d, vence_en: e.target.value }))}
                          />
                        ) : due ? (
                          due.toLocaleString()
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="w-32">
                        <EstadoBadge estado={t.estado} />
                        {t.completada && <span className="ml-2 badge badge-success badge-outline">Hecha</span>}
                      </td>
                      <td className="w-24">{t.usuario_email || "—"}</td>
                      <td className="text-right w-36">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <button className="btn btn-ghost btn-xs" onClick={() => saveEdit(t.id)} title="Guardar">
                              <Check size={14} />
                            </button>
                            <button className="btn btn-ghost btn-xs" onClick={() => setEditingId(null)} title="Cancelar">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            {!t.completada ? (
                              <button className="btn btn-ghost btn-xs" onClick={() => markDone(t.id)} title="Marcar como hecho">
                                <Check size={14} />
                              </button>
                            ) : (
                              <button className="btn btn-ghost btn-xs" onClick={() => reopen(t.id)} title="Reabrir">
                                <X size={14} />
                              </button>
                            )}
                            <button className="btn btn-ghost btn-xs" onClick={() => startEdit(t)} title="Editar">
                              <Edit2 size={14} />
                            </button>
                            <button className="btn btn-ghost btn-xs text-error" onClick={() => remove(t.id)} title="Eliminar">
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
