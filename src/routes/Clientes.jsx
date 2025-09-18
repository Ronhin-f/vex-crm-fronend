// src/routes/Clientes.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next"; // i18n
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
  Plus,
  X,
} from "lucide-react";

// Etapas canónicas (BE) — se muestran traducidas pero se envían así
const STAGES = [
  "Incoming Leads",
  "Unqualified",
  "Qualified",
  "Follow-up Missed",
  "Bid/Estimate Sent",
  "Won",
  "Lost",
];

function StageSelect({ value, onChange, t }) {
  const stageLabel = (s) => t(`common.stages.${s}`, s);
  return (
    <select
      className="select select-bordered select-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>
          {stageLabel(s)}
        </option>
      ))}
    </select>
  );
}

function DueBadge({ date, t }) {
  if (!date) return <span className="badge badge-ghost">{t("common.badges.noDueShort")}</span>;
  const due = new Date(date);
  const mins = (due.getTime() - Date.now()) / 60000;
  let tone = "badge-info";
  let label = t("common.badges.due");

  if (mins < 0) {
    tone = "badge-error";
    label = t("common.badges.overdue");
  } else if (mins <= 60 * 24) {
    tone = "badge-warning";
    label = t("common.badges.dueToday");
  }

  return (
    <span className={`badge ${tone} badge-outline`}>
      <CalendarClock size={12} className="mr-1" />
      {label}: {due.toLocaleString()}
    </span>
  );
}

/** SlideOver simple (derecha) sin dependencias externas */
function SlideOver({ open, onClose, title, children, widthClass = "w-full sm:w-[480px] md:w-[560px]" }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none select-none"}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full bg-base-100 shadow-xl border-l border-base-200 ${widthClass}
                    transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-3.25rem)]">{children}</div>
      </div>
    </div>
  );
}

export default function Clientes() {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);

  // Búsqueda agenda
  const [q, setQ] = useState("");

  // Slide-over (alta/edición)
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    categoria: "Incoming Leads", // compat FE (se refleja a stage)
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
        toast.error(t("clients.toasts.loadError"));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [t]);

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

  function openCreate() {
    setEditing(null);
    reset();
    setOpenForm(true);
  }

  function openEdit(cli) {
    setEditing(cli);
    setForm({
      nombre: cli.nombre || "",
      email: cli.email || "",
      telefono: cli.telefono || "",
      categoria: cli.categoria || cli.stage || "Incoming Leads",
      source: cli.source || "",
      contact_info: cli.contact_info || "",
      assignee_email: cli.assignee_email || "",
      due_date: cli.due_date ? new Date(cli.due_date).toISOString().slice(0, 16) : "",
      estimate_url: cli.estimate_url || "",
    });
    setOpenForm(true);
  }

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!form.nombre.trim()) return toast.error(t("clients.form.name"));
    const payload = {
      ...form,
      stage: form.categoria || "Incoming Leads",
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    };
    const un = toast.loading(t("actions.sending"));
    try {
      let resp;
      if (editing?.id) {
        resp = await api.patch(`/clientes/${editing.id}`, payload);
        setItems((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...resp.data } : c)));
        toast.success(t("clients.toasts.updated"));
      } else {
        resp = await api.post("/clientes", payload);
        setItems((prev) => [resp.data, ...prev]);
        toast.success(t("clients.toasts.created"));
      }
      setOpenForm(false);
      setEditing(null);
      reset();
    } catch {
      toast.error(editing?.id ? t("clients.toasts.updateError") : t("clients.toasts.cannotCreate"));
    } finally {
      toast.dismiss(un);
    }
  }

  async function uploadEstimateAndSet(file, setter) {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/upload/estimate", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setter(data.url);
    toast.success(t("clients.toasts.estimateUploaded"));
  }

  async function moveStage(id, _from, stage) {
    try {
      await moveCliente(id, stage);
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, categoria: stage, stage } : c)));
      toast.success(t("pipeline.toasts.moved", { stage: t(`common.stages.${stage}`, stage) }));
    } catch {
      toast.error(t("pipeline.toasts.moveError"));
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
      toast.success(t("clients.toasts.updated"));
    } catch {
      toast.error(t("clients.toasts.updateError"));
    }
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Agenda: due_date ASC (nulls al final), luego created_at
  const agenda = useMemo(() => {
    const term = q.trim().toLowerCase();
    let arr = [...items];
    if (term) {
      arr = arr.filter((c) =>
        [c.nombre, c.empresa, c.email, c.telefono, c.source]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );
    }
    arr.sort((a, b) => {
      const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      if (ad !== bd) return ad - bd;
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    });
    return arr;
  }, [items, q]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("clients.title")}</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> {t("actions.add")}
        </button>
      </div>

      {/* Filtro rápido */}
      <div className="flex items-center gap-2">
        <input
          className="input input-bordered input-sm w-full max-w-md"
          placeholder={t("pipeline.filters.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Agenda */}
      <section className="card bg-base-100 shadow">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>{t("clients.title")}</th>
                  <th className="hidden lg:table-cell">{t("common.source")}</th>
                  <th>{t("common.assignee")}</th>
                  <th>{t("actions.due")}</th>
                  <th className="hidden md:table-cell">{t("common.phone")}</th>
                  <th className="hidden md:table-cell">{t("clients.list.viewEstimate")}</th>
                  <th className="text-right pr-4">{t("actions.update")}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7}>
                          <div className="skeleton h-6 w-full" />
                        </td>
                      </tr>
                    ))}
                  </>
                )}
                {!isLoading && agenda.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center opacity-70 py-6">
                      {t("clients.list.none")}
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  agenda.map((c) => {
                    const curr = c.categoria || c.stage || "Incoming Leads";
                    const next = nextStageOf(curr);
                    const canAdvance = curr !== next;

                    return (
                      <tr key={c.id} className="hover">
                        <td onClick={() => openEdit(c)} className="cursor-pointer">
                          <div className="font-medium">{c.nombre}</div>
                          <div className="text-xs opacity-70">{c.empresa || "—"}</div>
                        </td>
                        <td className="hidden lg:table-cell">
                          <div className="badge badge-ghost">
                            {t(`common.sources.${c.source}`, c.source || "—")}
                          </div>
                        </td>
                        <td>
                          {c.assignee_email ? (
                            <span className="badge badge-outline">
                              <UserCircle2 size={12} className="mr-1" />
                              {c.assignee_email}
                            </span>
                          ) : (
                            <span className="opacity-60">{t("common.unassigned")}</span>
                          )}
                        </td>
                        <td>
                          <DueBadge date={c.due_date} t={t} />
                        </td>
                        <td className="hidden md:table-cell">
                          {c.telefono ? (
                            <a className="link flex items-center gap-1" href={`tel:${c.telefono}`}>
                              <Phone size={14} /> {c.telefono}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="hidden md:table-cell">
                          {c.estimate_url ? (
                            <a
                              className="btn btn-ghost btn-xs"
                              href={c.estimate_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Link2 size={14} className="mr-1" /> {t("clients.list.viewEstimate")}
                            </a>
                          ) : (
                            <span className="opacity-60">{t("common.badges.noEstimate")}</span>
                          )}
                        </td>
                        <td className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            <StageSelect value={curr} onChange={(stage) => moveStage(c.id, curr, stage)} t={t} />
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => {
                                if (!canAdvance) return;
                                moveStage(c.id, curr, next);
                              }}
                              disabled={!canAdvance}
                              title={t("pipeline.help.moveNext")}
                            >
                              <ChevronRight size={16} />
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => openEdit(c)}
                              title={t("actions.update")}
                            >
                              {t("actions.update")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SlideOver — alta/edición */}
      <SlideOver
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        title={editing ? t("actions.update") : t("actions.add")}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">{t("clients.form.name")}</label>
            <input
              className="input input-bordered w-full"
              name="nombre"
              value={form.nombre}
              onChange={onChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t("clients.form.stage")}</label>
              <select
                className="select select-bordered w-full"
                name="categoria"
                value={form.categoria}
                onChange={onChange}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {t(`common.stages.${s}`, s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("common.source")}</label>
              <input
                className="input input-bordered w-full"
                name="source"
                value={form.source}
                onChange={onChange}
                placeholder="Website / Referral / Outreach"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t("clients.form.assignee")}</label>
              <input
                className="input input-bordered w-full"
                name="assignee_email"
                value={form.assignee_email}
                onChange={onChange}
                placeholder="persona@empresa.com"
              />
            </div>
            <div>
              <label className="label">{t("clients.form.dueDate")}</label>
              <input
                type="datetime-local"
                className="input input-bordered w-full"
                name="due_date"
                value={form.due_date}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t("clients.form.email")}</label>
              <input
                className="input input-bordered w-full"
                name="email"
                value={form.email}
                onChange={onChange}
                type="email"
              />
            </div>
            <div>
              <label className="label">{t("clients.form.phone")}</label>
              <input
                className="input input-bordered w-full"
                name="telefono"
                value={form.telefono}
                onChange={onChange}
              />
            </div>
          </div>

          <div>
            <label className="label">{t("clients.form.estimateUrl")}</label>
            <div className="flex gap-2">
              <input
                className="input input-bordered w-full"
                name="estimate_url"
                value={form.estimate_url}
                onChange={onChange}
                placeholder="https://..."
              />
              <label className="btn btn-ghost" title={t("actions.upload")}>
                <Paperclip size={18} />
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      await uploadEstimateAndSet(f, (url) =>
                        setForm((prev) => ({ ...prev, estimate_url: url }))
                      );
                    } catch {
                      toast.error(t("clients.toasts.updateError"));
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="label">{t("clients.form.contactInfo")}</label>
            <textarea
              className="textarea textarea-bordered w-full"
              name="contact_info"
              value={form.contact_info}
              onChange={onChange}
              placeholder={t("clients.form.contactInfo")}
            />
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setOpenForm(false);
                setEditing(null);
              }}
            >
              {t("actions.cancel")}
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? t("actions.update") : t("actions.add")}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
