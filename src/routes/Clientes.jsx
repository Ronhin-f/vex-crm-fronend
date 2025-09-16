// src/routes/Clientes.jsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../utils/api";
import { moveCliente } from "../utils/vexKanbanApi";
import {
  CalendarClock,
  Mail,
  Phone,
  Paperclip,
  UserCircle2,
  Link2,
  ChevronRight,
  Info,
} from "lucide-react";

// Actualizado: incluye Unqualified y Follow-up Missed
const STAGES = [
  "Incoming Leads",
  "Unqualified",
  "Qualified",
  "Follow-up Missed",
  "Bid/Estimate Sent",
  "Won",
  "Lost",
];

function StageSelect({ value, onChange }) {
  return (
    <select
      className="select select-bordered select-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

function DueBadge({ date }) {
  if (!date) return <span className="badge badge-ghost">Sin due</span>;
  const due = new Date(date);
  const mins = (due.getTime() - Date.now()) / 60000;
  let tone = "badge-info";
  let label = "Vence";

  if (mins < 0) {
    tone = "badge-error";
    label = "Vencido";
  } else if (mins <= 60 * 24) {
    tone = "badge-warning";
    label = "Vence hoy";
  }

  return (
    <span className={`badge ${tone} badge-outline`}>
      <CalendarClock size={12} className="mr-1" />
      {label}: {due.toLocaleString()}
    </span>
  );
}

export default function Clientes() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    categoria: "Incoming Leads", // compat FE
    source: "Outreach",
    contact_info: "",
    assignee_email: "",
    due_date: "",
    estimate_url: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/clientes");
        setItems(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Error al cargar clientes");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const reset = () =>
    setForm({
      nombre: "",
      email: "",
      telefono: "",
      categoria: "Incoming Leads",
      source: "Outreach",
      contact_info: "",
      assignee_email: "",
      due_date: "",
      estimate_url: "",
    });

  async function onCreate(e) {
    e?.preventDefault?.();
    if (!form.nombre.trim()) return toast.error("Nombre requerido");
    try {
      const payload = {
        ...form,
        // compat: algunos BE usan stage; reflejamos ambos
        stage: form.categoria || "Incoming Leads",
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      };
      const { data } = await api.post("/clientes", payload);
      setItems((prev) => [data, ...prev]);
      reset();
      toast.success("Cliente creado");
    } catch {
      toast.error("No se pudo crear el cliente");
    }
  }

  async function uploadEstimateAndSet(file, setter) {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/upload/estimate", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setter(data.url);
    toast.success("Estimate subido");
  }

  async function moveStage(id, _from, stage) {
    try {
      await moveCliente(id, stage);
      // compat FE: actualizamos ambas props
      setItems((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, categoria: stage, stage } : c
        )
      );
      toast.success(`Movido a ${stage}`);
    } catch {
      toast.error("No pude mover el cliente");
    }
  }

  const nextStageOf = (current) => {
    const i = STAGES.indexOf(current);
    if (i < 0) return STAGES[0];
    return STAGES[Math.min(i + 1, STAGES.length - 1)];
  };

  async function quickPatch(id, payload) {
    try {
      const { data } = await api.patch(`/clientes/${id}`, payload);
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
      toast.success("Actualizado");
    } catch {
      toast.error("No pude actualizar");
    }
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>

      {/* Form alta */}
      <form onSubmit={onCreate} className="card bg-base-100 shadow mb-6">
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              className="input input-bordered w-full"
              name="nombre"
              value={form.nombre}
              onChange={onChange}
            />
          </div>
          <div>
            <label className="label">Stage</label>
            <select
              className="select select-bordered w-full"
              name="categoria"
              value={form.categoria}
              onChange={onChange}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              className="input input-bordered w-full"
              name="email"
              value={form.email}
              onChange={onChange}
              type="email"
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              className="input input-bordered w-full"
              name="telefono"
              value={form.telefono}
              onChange={onChange}
            />
          </div>

          <div>
            <label className="label">Assignee (email)</label>
            <input
              className="input input-bordered w-full"
              name="assignee_email"
              value={form.assignee_email}
              onChange={onChange}
              placeholder="persona@empresa.com"
            />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input
              type="datetime-local"
              className="input input-bordered w-full"
              name="due_date"
              value={form.due_date}
              onChange={onChange}
            />
          </div>

          <div>
            <label className="label">Source</label>
            <input
              className="input input-bordered w-full"
              name="source"
              value={form.source}
              onChange={onChange}
              placeholder="Website / Referral / Outreach"
            />
          </div>
          <div>
            <label className="label">Estimate (URL)</label>
            <div className="flex gap-2">
              <input
                className="input input-bordered w-full"
                name="estimate_url"
                value={form.estimate_url}
                onChange={onChange}
                placeholder="https://..."
              />
              <label className="btn btn-ghost" title="Subir archivo">
                <Paperclip size={18} />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    uploadEstimateAndSet(e.target.files[0], (url) =>
                      setForm((f) => ({ ...f, estimate_url: url }))
                    )
                  }
                />
              </label>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="label">Contact Info</label>
            <textarea
              className="textarea textarea-bordered w-full"
              name="contact_info"
              value={form.contact_info}
              onChange={onChange}
              placeholder="Notas, horarios, dirección, contacto alternativo…"
            />
          </div>

          <div className="md:col-span-2">
            <button className="btn btn-primary" type="submit">
              Agregar
            </button>
          </div>
        </div>
      </form>

      {/* Lista / edición rápida */}
      <section className="space-y-3">
        {isLoading ? (
          <div className="skeleton h-20 w-full" />
        ) : items.length === 0 ? (
          <div className="alert">
            <Info className="mr-2" />
            <span className="text-sm opacity-80">No hay clientes.</span>
          </div>
        ) : (
          items.map((c) => {
            const curr = c.categoria || c.stage || "Incoming Leads";
            const next = nextStageOf(curr);
            const canAdvance = curr !== next; // false si ya está al final
            return (
              <article key={c.id} className="card bg-base-100 shadow">
                <div className="card-body">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-semibold text-lg">{c.nombre}</div>
                    <div className="flex items-center gap-2">
                      <StageSelect
                        value={curr}
                        onChange={(stage) => moveStage(c.id, curr, stage)}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (!canAdvance) return;
                          moveStage(c.id, curr, next);
                        }}
                        disabled={!canAdvance}
                        title="Mover al siguiente stage"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Chips clave: source, assignee, due, estimate */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="badge badge-outline">
                      Source: {c.source || "—"}
                    </span>
                    <span className="badge badge-outline">
                      <UserCircle2 size={12} className="mr-1" />
                      {c.assignee_email || "Sin asignar"}
                    </span>
                    <DueBadge date={c.due_date} />
                    {c.estimate_url ? (
                      <a
                        className="badge badge-primary badge-outline no-underline"
                        href={c.estimate_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver estimate"
                      >
                        <Paperclip size={12} className="mr-1" />
                        Estimate
                      </a>
                    ) : (
                      <span className="badge badge-ghost">Sin estimate</span>
                    )}
                  </div>

                  {/* Info de contacto */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mt-3">
                    <div className="flex items-center gap-1 opacity-70">
                      <Mail size={14} /> {c.email || "—"}
                    </div>
                    <div className="flex items-center gap-1 opacity-70">
                      <Phone size={14} /> {c.telefono || "—"}
                    </div>
                    <div className="opacity-70 truncate">
                      {c.contact_info || "—"}
                    </div>
                  </div>

                  {/* Acciones rápidas */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      className="btn btn-ghost btn-sm gap-2"
                      onClick={() => {
                        const email = prompt("Assignee (email):", c.assignee_email || "");
                        if (email !== null) quickPatch(c.id, { assignee_email: email || null });
                      }}
                    >
                      <UserCircle2 size={16} /> Asignar
                    </button>
                    <button
                      className="btn btn-ghost btn-sm gap-2"
                      onClick={() => {
                        const val = prompt("Due date (YYYY-MM-DD HH:mm):", "");
                        if (val !== null) {
                          const iso = val ? new Date(val.replace(" ", "T")).toISOString() : null;
                          quickPatch(c.id, { due_date: iso });
                        }
                      }}
                    >
                      <CalendarClock size={16} /> Due
                    </button>
                    <button
                      className="btn btn-ghost btn-sm gap-2"
                      onClick={() => {
                        const url = prompt("URL de Estimate:", c.estimate_url || "");
                        if (url !== null) quickPatch(c.id, { estimate_url: url || null });
                      }}
                    >
                      <Link2 size={16} /> Estimate URL
                    </button>
                    <label className="btn btn-ghost btn-sm gap-2 cursor-pointer">
                      <Paperclip size={16} /> Subir
                      <input
                        type="file"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const fd = new FormData();
                          fd.append("file", f);
                          try {
                            const { data } = await api.post("/upload/estimate", fd, {
                              headers: { "Content-Type": "multipart/form-data" },
                            });
                            await quickPatch(c.id, { estimate_url: data.url });
                          } catch {
                            toast.error("No pude subir el estimate");
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
