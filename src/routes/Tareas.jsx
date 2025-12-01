// src/routes/Tareas.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import { Plus, Edit2, Trash2, Check, X, Calendar, User2, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/* ===========================
 * Helpers Vex Flows (frontend-only)
 * =========================== */
const FLOWS_URL = (import.meta.env.VITE_FLOWS_BASE_URL || "").replace(/\/$/, ""); // <- sin fallback

async function flowsHealth() {
  if (!FLOWS_URL) return false;
  try {
    const r = await fetch(`${FLOWS_URL}/health`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function flowsEmit(trigger, payload) {
  if (!FLOWS_URL) throw new Error("Flows no configurado");
  const res = await fetch(`${FLOWS_URL}/api/triggers/emit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    body: JSON.stringify({ trigger, payload }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Error enviando a Flows");
  }
  return res.json().catch(() => ({}));
}

function scheduleTaskReminder({
  channel,
  title,
  dueISO,
  offsetSec = 60,
  assignee,
  taskId,
}) {
  if (!dueISO) return Promise.reject(new Error("No hay fecha de vencimiento"));
  const whenMs = new Date(dueISO).getTime() - offsetSec * 1000;
  const when = new Date(Math.max(whenMs, Date.now() + 1000)).toISOString();
  const text = `â° Recordatorio: "${title}" asignada a ${assignee || "(sin asignar)"} vence ${new Date(
    dueISO
  ).toLocaleString()}`;
  const payload = {
    channel: channel || "#general",
    text,
    schedule_at: when,
    meta: { taskId, dueISO, offsetSec, assignee, title },
  };
  return flowsEmit("task.reminder.slack", payload);
}
/* =========================== */

function EstadoBadge({ estado }) {
  const map = {
    todo: "badge-ghost",
    doing: "badge-info",
    waiting: "badge-warning",
    done: "badge-success",
  };
  return (
    <span className={`badge ${map[estado] || "badge-ghost"} badge-outline`}>
      {estado || "todo"}
    </span>
  );
}

function PrioridadBadge({ prioridad }) {
  const key = (prioridad || "media").toLowerCase();
  const classes =
    key === "alta" ? "badge-error" : key === "baja" ? "badge-success" : "badge-warning";
  const label =
    key === "alta"
      ? "Prioridad alta"
      : key === "baja"
      ? "Prioridad baja"
      : "Prioridad media";
  return <span className={`badge ${classes} badge-outline`}>{label}</span>;
}

export default function Tareas() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // usuarios (asignado a)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // clientes (para select por correo)
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // alta
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    cliente_id: "",
    vence_en: "",
    usuario_email: "",
    prioridad: "media",
    recordatorio: false,
  });

  // recordatorio Slack
  const [slack, setSlack] = useState({
    enable: false,
    channel: "#general",
    offsetValue: 15,
    offsetUnit: "min",
  });
  const [flowsOk, setFlowsOk] = useState(false);
  const { orgId: authOrgId } = useAuth();
  const orgId = useMemo(() => {
    if (authOrgId) return authOrgId;
    try {
      return localStorage.getItem("organizacion_id") || null;
    } catch {
      return null;
    }
  }, [authOrgId]);

  // ediciÃ³n
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    titulo: "",
    descripcion: "",
    cliente_id: "",
    vence_en: "",
    usuario_email: "",
    prioridad: "media",
    recordatorio: false,
  });

  // helpers
  const correoOptions = useMemo(
    () =>
      (clientes || [])
        .filter((c) => !!c.email)
        .map((c) => ({
          value: String(c.id),
          label: `${c.email}${c.nombre ? ` â€” ${c.nombre}` : ""}`,
        })),
    [clientes]
  );

  function labelClienteById(id) {
    const c = clientes.find((x) => x.id === (Number(id) || id));
    if (!c) return id ? `#${id}` : "â€”";
    return c.email || c.nombre || `#${id}`;
  }

  // loads
  async function load() {
    setLoading(true);
    try {
      if (!orgId) {
        setItems([]);
        return;
      }
      const { data } = await api.get("/tareas", { params: { organizacion_id: orgId } });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("No pude cargar tareas");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      if (!orgId) return setUsers([]);
      const { data } = await api.get("/users", { params: { organizacion_id: orgId } }); // endpoint principal
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      setUsers(items);
    } catch (e) {
      console.warn("No pude cargar usuarios", e);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadClientes() {
    setLoadingClientes(true);
    try {
      if (!orgId) return setClientes([]);
      const { data } = await api.get("/clientes", { params: { organizacion_id: orgId } });
      setClientes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("No pude cargar clientes", e);
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  }

  useEffect(() => {
    load();
    loadUsers();
    loadClientes();
    (async () => setFlowsOk(await flowsHealth()))();
  }, [orgId]);

  // ---- Alta ----
  async function onAdd(e) {
    e?.preventDefault?.();
    if (!orgId) return toast.error("organizacion_id requerido");
    const titulo = form.titulo?.trim();
    if (!titulo) return toast.error("TÃ­tulo requerido");

    const assignedEmail = form.usuario_email || null;

    const payload = {
      titulo,
      descripcion: form.descripcion?.trim() || null,
      cliente_id:
        form.cliente_id && form.cliente_id !== "interno"
          ? Number(form.cliente_id)
          : null,
      vence_en: form.vence_en ? new Date(form.vence_en).toISOString() : null,
      estado: "todo",
      completada: false,
      usuario_email: assignedEmail, // compat
      assignee_email: assignedEmail || undefined, // alias aceptado por el BE
      prioridad: form.prioridad || "media",
      recordatorio: !!form.recordatorio,
      organizacion_id: orgId,
    };

    try {
      const { data } = await api.post("/tareas", payload);

      // Recordatorio Slack (solo canal)
      const shouldRemind =
        (form.recordatorio || slack.enable) &&
        !!payload.vence_en &&
        FLOWS_URL &&
        flowsOk;
      if (shouldRemind) {
        try {
          const created = data || payload;
          const offsetSec =
            Number(slack.offsetValue || 0) *
            (slack.offsetUnit === "sec" ? 1 : 60);
          await scheduleTaskReminder({
            channel: (slack.channel || "").trim() || "#general",
            title: payload.titulo,
            dueISO: payload.vence_en,
            offsetSec,
            assignee: created.usuario_email || assignedEmail,
            taskId: created.id || created.task_id,
          });
          toast.success("Recordatorio de Slack agendado");
        } catch (err) {
          console.warn("No se pudo agendar Slack:", err);
          toast.error("No pude agendar el recordatorio de Slack");
        }
      }

      setItems((prev) => [{ ...(data ?? payload) }, ...prev]);
      setForm({
        titulo: "",
        descripcion: "",
        cliente_id: "",
        vence_en: "",
        usuario_email: "",
        prioridad: "media",
        recordatorio: false,
      });
      setSlack((s) => ({ ...s, enable: false }));
      toast.success("Tarea creada");
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
      vence_en: it.vence_en
        ? new Date(it.vence_en).toISOString().slice(0, 16)
        : "",
      usuario_email: it.usuario_email || "",
      prioridad: (it.prioridad || "media").toLowerCase(),
      recordatorio: !!it.recordatorio,
    });
  }

  // util: arma payload PATCH solo con campos presentes
  const clean = (obj) => {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v === undefined) return;
      if (v === "") {
        out[k] = null;
        return;
      }
      out[k] = v === null ? null : v;
    });
    return out;
  };

  async function saveEdit(id) {
    if (!orgId) return toast.error("organizacion_id requerido");
    const payload = clean({
      titulo: draft.titulo?.trim(),
      descripcion: draft.descripcion?.trim(),
      cliente_id:
        draft.cliente_id && draft.cliente_id !== "interno"
          ? Number(draft.cliente_id)
          : null,
      vence_en: draft.vence_en ? new Date(draft.vence_en).toISOString() : null,
      usuario_email: draft.usuario_email || null,
      prioridad: draft.prioridad || "media",
      recordatorio: !!draft.recordatorio,
      organizacion_id: orgId,
    });
    try {
      const { data } = await api.patch(`/tareas/${id}`, payload);
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...(data || payload) } : x))
      );
      setEditingId(null);
      toast.success("Tarea actualizada");
    } catch (e) {
      console.error(e);
      toast.error("No pude actualizar la tarea");
    }
  }

  // ---- Completar / Reabrir ----
  async function markDone(id) {
    if (!orgId) return toast.error("organizacion_id requerido");
    try {
      const { data } = await api.patch(`/tareas/${id}`, {
        completada: true,
        estado: "done",
        organizacion_id: orgId,
      });
      setItems((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...(data || { completada: true, estado: "done" }) }
            : t
        )
      );
      toast.success("Marcada como hecha");
    } catch (e) {
      console.error(e);
      toast.error("No pude completar la tarea");
    }
  }

  async function reopen(id) {
    if (!orgId) return toast.error("organizacion_id requerido");
    try {
      const { data } = await api.patch(`/tareas/${id}`, {
        completada: false,
        estado: "todo",
        organizacion_id: orgId,
      });
      setItems((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...(data || { completada: false, estado: "todo" }) }
            : t
        )
      );
      toast.success("Tarea reabierta");
    } catch (e) {
      console.error(e);
      toast.error("No pude reabrir la tarea");
    }
  }

  // ---- Eliminar ----
  async function remove(id) {
    if (!orgId) return toast.error("organizacion_id requerido");
    if (!confirm("Eliminar tarea?")) return;
    try {
      await api.delete(`/tareas/${id}`, { params: orgId ? { organizacion_id: orgId } : {} });
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success("Tarea eliminada");
    } catch (e) {
      console.error(e);
      toast.error("No pude eliminar la tarea");
    }
  }
  // ---- Test Slack inmediato (solo canal)
  async function testSlack() {
    if (!FLOWS_URL || !flowsOk) return toast.error("Flows no disponible");
    const channel = (slack.channel || "").trim();
    if (!channel) return toast.error("DefinÃ­ un canal (#general, por ejemplo)");
    try {
      await flowsEmit("slack.message", {
        channel,
        text: `Test Slack desde VEX CRM (${new Date().toLocaleTimeString()})`,
      });
      toast.success("Enviado a Slack");
    } catch (e) {
      console.error(e);
      toast.error("No pude enviar a Slack");
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Tareas</h1>

      {/* Alta rÃ¡pida */}
      <form onSubmit={onAdd} className="card bg-base-100 shadow mb-6">
        <div className="card-body grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <label className="label">TÃ­tulo *</label>
            <input
              className="input input-bordered w-full"
              value={form.titulo}
              onChange={(e) =>
                setForm((f) => ({ ...f, titulo: e.target.value }))
              }
              placeholder="Ej: Llamar a Juan por presupuesto"
            />
          </div>

          <div className="md:col-span-3">
            <label className="label">DescripciÃ³n</label>
            <input
              className="input input-bordered w-full"
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Correos</label>
            {correoOptions.length > 0 ? (
              <select
                className="select select-bordered w-full"
                value={form.cliente_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cliente_id: e.target.value }))
                }
              >
                <option value="">(Sin cliente)</option>
                <option value="interno">INTERNO</option>
                {correoOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  className="input input-bordered w-full"
                  placeholder="No encuentro clientes con correo â€” creÃ¡ el cliente primero"
                  disabled
                />
                {loadingClientes && (
                  <span className="text-xs opacity-70">
                    Cargando correosâ€¦
                  </span>
                )}
              </>
            )}
          </div>

          <div>
            <label className="label">Vence en</label>
            <input
              type="datetime-local"
              className="input input-bordered w-full"
              value={form.vence_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, vence_en: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <User2 size={16} /> Asignado a
              <button
                type="button"
                className="btn btn-ghost btn-xs ml-auto"
                onClick={loadUsers}
                title="Recargar usuarios"
              >
                â†»
              </button>
            </label>

            <select
              className="select select-bordered w-full"
              value={form.usuario_email}
              onChange={(e) =>
                setForm((f) => ({ ...f, usuario_email: e.target.value }))
              }
              disabled={loadingUsers && users.length === 0}
            >
              <option value="">(Sin asignar)</option>
              {users.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.name || u.nombre || u.full_name || u.email}
                  {u.rol ? ` â€” ${u.rol}` : ""}
                </option>
              ))}
              {!loadingUsers && users.length === 0 && (
                <option disabled>(Sin usuarios disponibles)</option>
              )}
            </select>
            {loadingUsers && (
              <span className="text-xs opacity-70">Cargando usuariosâ€¦</span>
            )}
          </div>

          <div>
            <label className="label">Prioridad</label>
            <select
              className="select select-bordered w-full"
              value={form.prioridad}
              onChange={(e) =>
                setForm((f) => ({ ...f, prioridad: e.target.value }))
              }
            >
              <option value="alta">Prioridad alta</option>
              <option value="media">Prioridad media</option>
              <option value="baja">Prioridad baja</option>
            </select>
          </div>

          {/* Recordatorio simple toggle */}
          <div>
            <label className="label flex items-center gap-1">
              <Bell size={16} /> Recordatorio
            </label>
            <input
              type="checkbox"
              className="toggle"
              checked={!!form.recordatorio}
              onChange={(e) => {
                const enabled = e.target.checked;
                setForm((f) => ({ ...f, recordatorio: enabled }));
                setSlack((s) => ({ ...s, enable: enabled || s.enable }));
              }}
            />
            <p className="text-xs opacity-70 mt-1">
              Si estÃ¡ activado y hay â€œVence enâ€, se agenda aviso por Slack.
            </p>
          </div>

          {/* Recordatorio por Slack (opcional) */}
          <div className="md:col-span-6">
            <fieldset className="border rounded p-3">
              <legend className="px-1 text-sm font-medium">
                Recordatorio por Slack (opcional)
              </legend>
              {!FLOWS_URL ? (
                <p className="text-xs text-amber-700">
                  No configurado (agregÃ¡ VITE_FLOWS_BASE_URL)
                </p>
              ) : flowsOk ? (
                <p className="text-xs text-green-700">Flows online âœ…</p>
              ) : (
                <p className="text-xs text-amber-700">
                  Flows no disponible. La tarea se crearÃ¡ sin recordatorio.
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <div>
                  <label className="label">Canal (opcional)</label>
                  <input
                    className="input input-bordered w-full"
                    placeholder="#canal"
                    value={slack.channel}
                    onChange={(e) =>
                      setSlack((s) => ({ ...s, channel: e.target.value }))
                    }
                    disabled={!slack.enable}
                  />
                </div>

                <div>
                  <label className="label">Tiempo antes</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      className="input input-bordered w-full"
                      placeholder="Valor"
                      value={slack.offsetValue}
                      onChange={(e) =>
                        setSlack((s) => ({
                          ...s,
                          offsetValue: Number(e.target.value || 0),
                        }))
                      }
                      disabled={!slack.enable}
                    />
                    <select
                      className="select select-bordered"
                      value={slack.offsetUnit}
                      onChange={(e) =>
                        setSlack((s) => ({ ...s, offsetUnit: e.target.value }))
                      }
                      disabled={!slack.enable}
                    >
                      <option value="sec">segundos</option>
                      <option value="min">minutos</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    className="btn btn-ghost w-full"
                    onClick={testSlack}
                    disabled={!FLOWS_URL || !flowsOk}
                  >
                    PROBAR SLACK
                  </button>
                </div>
              </div>
            </fieldset>
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
                <th>TÃ­tulo</th>
                <th>Cliente</th>
                <th>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} /> Vence
                  </div>
                </th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>
                  <div className="flex items-center gap-1">
                    <User2 size={14} /> Asignado a
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
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                titulo: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <div className="font-medium">{t.titulo}</div>
                        )}
                        <div className="text-xs opacity-70">
                          {isEditing ? (
                            <input
                              className="input input-bordered input-xs w-full mt-1"
                              value={draft.descripcion}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  descripcion: e.target.value,
                                }))
                              }
                              placeholder="DescripciÃ³n"
                            />
                          ) : (
                            t.descripcion || "â€”"
                          )}
                        </div>
                      </td>

                      <td className="w-56">
                        {isEditing ? (
                          <select
                            className="select select-bordered select-sm w-full"
                            value={draft.cliente_id}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                cliente_id: e.target.value,
                              }))
                            }
                          >
                            <option value="">(Sin cliente)</option>
                            <option value="interno">INTERNO</option>
                            {correoOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="truncate">
                            {t.cliente_email ||
                              t.cliente_nombre ||
                              labelClienteById(t.cliente_id)}
                          </div>
                        )}
                      </td>

                      <td className="w-56">
                        {isEditing ? (
                          <input
                            type="datetime-local"
                            className="input input-bordered input-sm w-full"
                            value={draft.vence_en}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                vence_en: e.target.value,
                              }))
                            }
                          />
                        ) : due ? (
                          due.toLocaleString()
                        ) : (
                          "â€”"
                        )}
                      </td>

                      <td className="w-32">
                        <EstadoBadge estado={t.estado} />
                        {t.completada && (
                          <span className="ml-2 badge badge-success badge-outline">
                            Hecha
                          </span>
                        )}
                      </td>

                      <td className="w-40">
                        {isEditing ? (
                          <select
                            className="select select-bordered select-sm w-full"
                            value={draft.prioridad}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                prioridad: e.target.value,
                              }))
                            }
                          >
                            <option value="alta">Prioridad alta</option>
                            <option value="media">Prioridad media</option>
                            <option value="baja">Prioridad baja</option>
                          </select>
                        ) : (
                          <PrioridadBadge prioridad={t.prioridad} />
                        )}
                      </td>

                      <td className="w-48">
                        {isEditing ? (
                          <select
                            className="select select-bordered select-sm w-full"
                            value={draft.usuario_email}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                usuario_email: e.target.value,
                              }))
                            }
                            disabled={loadingUsers && users.length === 0}
                          >
                            <option value="">(Sin asignar)</option>
                            {users.map((u) => (
                              <option key={u.email} value={u.email}>
                                {u.name || u.nombre || u.full_name || u.email}
                              </option>
                            ))}
                            {!loadingUsers && users.length === 0 && (
                              <option disabled>(Sin usuarios disponibles)</option>
                            )}
                          </select>
                        ) : (
                          t.usuario_email || "â€”"
                        )}
                      </td>

                      <td className="text-right w-36">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => saveEdit(t.id)}
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
                            {!t.completada ? (
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => markDone(t.id)}
                                title="Marcar como hecho"
                              >
                                <Check size={14} />
                              </button>
                            ) : (
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => reopen(t.id)}
                                title="Reabrir"
                              >
                                <X size={14} />
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => startEdit(t)}
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => remove(t.id)}
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
