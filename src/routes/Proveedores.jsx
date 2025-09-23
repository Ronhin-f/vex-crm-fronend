// src/routes/Proveedores.jsx
// Reemplazado por listado + CRUD de Proveedores/Subcontratistas
import { useEffect, useState } from "react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Search,
} from "lucide-react";

function qs(obj = {}) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v == null || String(v).trim() === "") return;
    p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export default function Compras() {
  // Ahora esta ruta muestra Proveedores
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");

  // alta rápida
  const [form, setForm] = useState({
    nombre: "",
    tipo: "proveedor",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
  });

  // edición inline
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    nombre: "",
    tipo: "proveedor",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
  });

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/proveedores${qs({ q, tipo })}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("No pude cargar proveedores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tipo]);

  async function onAdd(e) {
    e?.preventDefault?.();
    const payload = {
      nombre: form.nombre?.trim(),
      tipo: form.tipo,
      email: form.email?.trim() || null,
      telefono: form.telefono?.trim() || null,
      direccion: form.direccion?.trim() || null,
      notas: form.notas?.trim() || null,
    };
    if (!payload.nombre) return toast.error("Nombre requerido");
    if (!payload.tipo) return toast.error("Tipo requerido");

    try {
      const { data } = await api.post("/proveedores", payload);
      setItems((prev) => [data, ...prev]);
      setForm({
        nombre: "",
        tipo: "proveedor",
        email: "",
        telefono: "",
        direccion: "",
        notas: "",
      });
      toast.success("Proveedor creado");
    } catch (e) {
      console.error(e);
      toast.error("No pude crear el proveedor");
    }
  }

  function startEdit(it) {
    setEditingId(it.id);
    setDraft({
      nombre: it.nombre || "",
      tipo: it.tipo || "proveedor",
      email: it.email || "",
      telefono: it.telefono || "",
      direccion: it.direccion || "",
      notas: it.notas || "",
    });
  }

  async function saveEdit(id) {
    const payload = {};
    if (draft.nombre?.trim() !== "") payload.nombre = draft.nombre.trim();
    if (draft.tipo) payload.tipo = draft.tipo;
    payload.email = draft.email?.trim() || null;
    payload.telefono = draft.telefono?.trim() || null;
    payload.direccion = draft.direccion?.trim() || null;
    payload.notas = draft.notas?.trim() || null;

    try {
      const { data } = await api.patch(`/proveedores/${id}`, payload);
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...data } : x)));
      setEditingId(null);
      toast.success("Proveedor actualizado");
    } catch (e) {
      console.error(e);
      toast.error("No pude actualizar el proveedor");
    }
  }

  async function remove(id) {
    if (!confirm("¿Eliminar proveedor?")) return;
    try {
      await api.delete(`/proveedores/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success("Proveedor eliminado");
    } catch (e) {
      console.error(e);
      toast.error("No pude eliminar el proveedor");
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 size={22} /> Proveedores
        </h1>
        <div className="flex items-center gap-2">
          <div className="join">
            <div className="join-item relative">
              <Search className="absolute left-2 top-2.5 opacity-60" size={16} />
              <input
                className="input input-sm input-bordered pl-7"
                placeholder="Buscar por nombre/email/teléfono"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              className="select select-sm select-bordered join-item"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              title="Tipo"
            >
              <option value="">Todos</option>
              <option value="proveedor">Proveedor</option>
              <option value="subcontratista">Subcontratista</option>
            </select>
            {(q || tipo) && (
              <button
                className="btn btn-sm join-item"
                onClick={() => {
                  setQ("");
                  setTipo("");
                }}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alta rápida */}
      <form onSubmit={onAdd} className="card bg-base-100 shadow mb-6">
        <div className="card-body grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <label className="label">Nombre *</label>
            <input
              className="input input-bordered w-full"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Ferretería San Martín"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Tipo *</label>
            <select
              className="select select-bordered w-full"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              <option value="proveedor">Proveedor</option>
              <option value="subcontratista">Subcontratista</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 opacity-60" size={16} />
              <input
                className="input input-bordered w-full pl-8"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="contacto@proveedor.com"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 opacity-60" size={16} />
              <input
                className="input input-bordered w-full pl-8"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                placeholder="+54 9 ..."
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">Dirección</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 opacity-60" size={16} />
              <input
                className="input input-bordered w-full pl-8"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                placeholder="Av. Siempre Viva 123"
              />
            </div>
          </div>

          <div className="md:col-span-12">
            <label className="label">Notas</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 opacity-60" size={16} />
              <input
                className="input input-bordered w-full pl-8"
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                placeholder="Horario, condiciones, etc."
              />
            </div>
          </div>

          <div className="md:col-span-12">
            <button className="btn btn-primary">
              <Plus size={16} />
              Agregar proveedor
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
                <th className="w-1/5">Nombre</th>
                <th className="w-28">Tipo</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Notas</th>
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
                    <div className="p-6 text-sm opacity-70">No hay proveedores.</div>
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const isEditing = editingId === it.id;
                  return (
                    <tr key={it.id}>
                      <td className="align-top">
                        {isEditing ? (
                          <input
                            className="input input-bordered input-sm w-full"
                            value={draft.nombre}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, nombre: e.target.value }))
                            }
                          />
                        ) : (
                          <div className="truncate">{it.nombre}</div>
                        )}
                      </td>
                      <td className="align-top">
                        {isEditing ? (
                          <select
                            className="select select-bordered select-sm w-full"
                            value={draft.tipo}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, tipo: e.target.value }))
                            }
                          >
                            <option value="proveedor">Proveedor</option>
                            <option value="subcontratista">Subcontratista</option>
                          </select>
                        ) : (
                          <span className="badge badge-outline">{it.tipo || "—"}</span>
                        )}
                      </td>
                      <td className="align-top">
                        {isEditing ? (
                          <input
                            className="input input-bordered input-sm w-full"
                            value={draft.email}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, email: e.target.value }))
                            }
                          />
                        ) : (
                          <div className="truncate">{it.email || "—"}</div>
                        )}
                      </td>
                      <td className="align-top">
                        {isEditing ? (
                          <input
                            className="input input-bordered input-sm w-full"
                            value={draft.telefono}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, telefono: e.target.value }))
                            }
                          />
                        ) : (
                          <div className="truncate">{it.telefono || "—"}</div>
                        )}
                      </td>
                      <td className="align-top">
                        {isEditing ? (
                          <input
                            className="input input-bordered input-sm w-full"
                            value={draft.direccion}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, direccion: e.target.value }))
                            }
                          />
                        ) : (
                          <div className="truncate">{it.direccion || "—"}</div>
                        )}
                      </td>
                      <td className="align-top">
                        {isEditing ? (
                          <input
                            className="input input-bordered input-sm w-full"
                            value={draft.notas}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, notas: e.target.value }))
                            }
                          />
                        ) : (
                          <div className="truncate">{it.notas || "—"}</div>
                        )}
                      </td>
                      <td className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => saveEdit(it.id)}
                              title="Guardar"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => setEditingId(null)}
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => startEdit(it)}
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => remove(it.id)}
                              title="Eliminar"
                            >
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
