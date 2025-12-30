// frontend/src/routes/ProyectosKanban.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  CalendarClock,
  Mail,
  Phone,
  Paperclip,
  UserCircle2,
  ChevronRight,
  Filter,
  X,
  Search,
  Clock3,
  Building2,
  Tag,
  Plus,
  Save,
  Pencil,
} from "lucide-react";
import api from "../utils/api";
import { fetchProyectosKanban, moveProyecto } from "../utils/vexKanbanApi";
import { useUsersOptions } from "../hooks/useUsersOptions";
import { useArea } from "../context/AreaContext";

const PIPELINE_DEFAULT = [
  "Incoming Leads",
  "Unqualified",
  "Qualified",
  "Follow-up Missed",
  "Bid/Estimate Sent",
  "Won",
  "Lost",
];
const PIPELINE_VET = ["Turno fijado", "Pre quirurgico", "Completado", "Turno perdido", "Lost"];
const HIDDEN_VET = new Set(["Lost"]);

const SOURCE_OPTS = [
  "Outreach",
  "Building Connected",
  "Building Connected ITB",
  "Blue Book",
  "Blue Book ITB",
  "Gmail",
  "Email",
  "Website",
  "Referral",
  "Unknown",
];

const sortByDueCreated = (items = []) => {
  const arr = [...items];
  arr.sort((a, b) => {
    const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    if (da !== db) return da - db;
    const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
    const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return cb - ca;
  });
  return arr;
};

function useQueryState() {
  const [state, setState] = useState(() => {
    const u = new URL(window.location.href);
    return {
      q: u.searchParams.get("q") || "",
      source: u.searchParams.get("source") || "",
      assignee: u.searchParams.get("assignee") || "",
      only_due: u.searchParams.get("only_due") === "1",
    };
  });

  useEffect(() => {
    const current = new URL(window.location.href);
    const next = new URL(window.location.href);
    Object.entries(state).forEach(([k, v]) => {
      if (!v || (k === "only_due" && !v)) next.searchParams.delete(k);
      else next.searchParams.set(k, k === "only_due" ? "1" : String(v));
    });
    if (next.search !== current.search) {
      window.history.replaceState({}, "", `${next.pathname}${next.search}`);
    }
  }, [state]);

  return [state, setState];
}

const FiltersBar = ({ value, onChange, onClear, right }) => {
  const { t } = useTranslation();
  const [typing, setTyping] = useState(value.q);
  useEffect(() => {
    const tmo = setTimeout(() => onChange({ ...value, q: typing }), 350);
    return () => clearTimeout(tmo);
  }, [typing]); // eslint-disable-line

  return (
    <div className="mb-4 rounded-2xl bg-base-200 border border-base-300 p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-[220px]">
        <Search size={16} className="opacity-70" />
        <input
          className="input input-sm input-bordered w-full"
          placeholder={t("pipeline.filters.searchPlaceholder")}
          value={typing}
          onChange={(e) => setTyping(e.target.value)}
        />
      </div>

      <div className="flex gap-2 items-center">
        <select
          className="select select-sm select-bordered"
          value={value.source}
          onChange={(e) => onChange({ ...value, source: e.target.value })}
        >
          <option value="">{t("pipeline.filters.sourceAll")}</option>
          <option>Outreach</option>
          <option>Blue Book ITB</option>
          <option>Inbound</option>
          <option>Referral</option>
          <option>Building Connected</option>
          <option>Gmail</option>
        </select>

        <select
          className="select select-sm select-bordered"
          value={value.assignee}
          onChange={(e) => onChange({ ...value, assignee: e.target.value })}
        >
          <option value="">{t("pipeline.filters.assigneeAll")}</option>
          <option>{t("common.unassigned")}</option>
        </select>

        <label className="label cursor-pointer gap-2">
          <span className="label-text">{t("pipeline.filters.onlyDue")}</span>
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={value.only_due}
            onChange={(e) => onChange({ ...value, only_due: e.target.checked })}
          />
        </label>

        {value.q || value.source || value.assignee || value.only_due ? (
          <button className="btn btn-sm" onClick={onClear}>
            <X size={16} /> {t("actions.clear")}
          </button>
        ) : (
          <div className="btn btn-sm btn-ghost no-animation">
            <Filter size={16} /> {t("pipeline.filters.title")}
          </div>
        )}

        {right}
      </div>
    </div>
  );
};

const DueBadge = ({ date, compact }) => {
  const { t } = useTranslation();
  if (!date) return null;
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
    <span className={`badge ${tone} ${compact ? "badge-xs" : "badge-sm"} badge-outline`}>
      <CalendarClock size={12} className="mr-1" />
      {label}: {due.toLocaleString()}
    </span>
  );
};

const EstimateChip = ({ url, compact }) => {
  const { t } = useTranslation();
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`badge badge-primary ${compact ? "badge-xs" : "badge-sm"} badge-outline no-underline`}
      title={t("clients.list.viewEstimate")}
      onClick={(e) => e.stopPropagation()}
    >
      <Paperclip size={12} className="mr-1" />
      {t("common.badges.estimate")}
    </a>
  );
};

const DetailModal = ({ open, onClose, item, onEdit, onDelete }) => {
  const { t } = useTranslation();
  if (!open || !item) return null;
  const assignee = item.assignee_email || item.assignee || t("common.unassigned");
  const stageLabel = (s) => t(`common.stages.${s}`, s);
  const notas = item.descripcion || item.notas || "";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-base-100 shadow-xl border border-base-300 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">{item.nombre || item.email || t("common.noData")}</h3>
            {item.empresa && (
              <div className="text-sm opacity-70 truncate flex items-center gap-1">
                <Building2 size={14} /> {item.empresa}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm" onClick={() => onEdit?.(item)}>
              <Pencil size={16} /> {t("actions.update")}
            </button>
            <button className="btn btn-sm btn-error" onClick={() => onDelete?.(item)}>
              <X size={16} /> {t("actions.delete", "Eliminar")}
            </button>
            <button className="btn btn-sm" onClick={onClose}>
              <X size={16} /> {t("actions.close")}
            </button>
          </div>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-base-200 p-3">
            <div className="text-sm font-medium mb-2">{t("pipeline.modals.contact")}</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={14} /> {item.email || "—"}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} /> {item.telefono || "—"}
              </div>
              <div className="flex items-center gap-2">
                <UserCircle2 size={14} /> {assignee}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-base-200 p-3">
            <div className="text-sm font-medium mb-2">{t("pipeline.modals.tracking")}</div>
            <div className="flex flex-wrap gap-2 items-center">
              {item.source && (
                <span className="badge badge-outline">
                  <Tag size={12} className="mr-1" />
                  {t(`common.sources.${item.source}`, item.source)}
                </span>
              )}
              <DueBadge date={item.due_date} />
              <EstimateChip url={item.estimate_url} />
              {item.stage && <span className="badge badge-outline">{stageLabel(item.stage)}</span>}
            </div>
            {notas && (
              <div className="mt-3">
                <div className="text-xs opacity-60 mb-1">{t("common.notes")}</div>
                <div className="rounded-lg bg-base-100 p-2 border border-base-300 text-sm whitespace-pre-wrap">
                  {notas}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs opacity-60 flex items-center gap-3">
          <Clock3 size={12} /> {t("common.createdAt")}: {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
        </div>
      </div>
    </div>
  );
};

const CreateProjectModal = ({ open, onClose, onCreated, clients, pipeline, hiddenStages }) => {
  const { t } = useTranslation();
  const { options: userOpts } = useUsersOptions();
  const stageOptions = useMemo(
    () => (pipeline || PIPELINE_DEFAULT).filter((s) => !hiddenStages?.has?.(s)),
    [pipeline, hiddenStages]
  );
    const [form, setForm] = useState({
      nombre: "",
      cliente_id: "",
      stage: stageOptions[0] || PIPELINE_DEFAULT[0],
      contacto_nombre: "",
      estimate_amount: "",
      estimate_currency: "USD",
      source: "",
      assignee: "",
      descripcion: "",
      due_date: "",
    });
    const [saving, setSaving] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [contactQuery, setContactQuery] = useState("");

    useEffect(() => {
      if (open) {
        setForm((f) => ({ ...f, stage: stageOptions[0] || PIPELINE_DEFAULT[0], due_date: "", contacto_nombre: "" }));
        setContactQuery("");
        setContacts([]);
      }
    }, [open, stageOptions]);

    useEffect(() => {
      if (!open) return;
      if (!form.cliente_id) {
        setContacts([]);
        return;
      }
      (async () => {
        try {
          setLoadingContacts(true);
          const { data } = await api.get(`/clientes/${form.cliente_id}/contactos`);
          setContacts(Array.isArray(data) ? data : []);
        } catch {
          setContacts([]);
        } finally {
          setLoadingContacts(false);
        }
      })();
    }, [open, form.cliente_id]);

    const contactItems = useMemo(() => {
      const term = contactQuery.trim().toLowerCase();
      const list = Array.isArray(contacts) ? contacts : [];
      if (!term) return list;
      return list.filter((c) =>
        [c.nombre, c.email, c.telefono, c.cargo, c.rol]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );
    }, [contacts, contactQuery]);

  if (!open) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre?.trim()) {
      toast.error(t("validation.requiredName", "Nombre requerido"));
      return;
    }
    try {
      setSaving(true);
      const payload = {
        nombre: form.nombre?.trim(),
        cliente_id: form.cliente_id ? Number(form.cliente_id) : null,
        stage: form.stage,
        source: form.source || null,
        assignee: form.assignee || null,
        contacto_nombre: form.contacto_nombre?.trim() || null,
        estimate_amount: form.estimate_amount ? Number(form.estimate_amount) : null,
        estimate_currency: form.estimate_currency || null,
        descripcion: form.descripcion?.trim() || null,
        notas: form.descripcion?.trim() || null,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      };
      const res = await api.post("/proyectos", payload);
      if (res?.data?.ok) {
        toast.success(t("pipeline.toasts.created", "Proyecto creado"));
        onClose();
        onCreated?.();
      } else {
        throw new Error(res?.data?.message || "Error creando proyecto");
      }
    } catch (err) {
      console.error(err);
      toast.error(t("pipeline.toasts.createError", "No se pudo crear"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4" onClick={onClose}>
      <form
        className="w-full max-w-lg rounded-2xl bg-base-100 shadow-xl border border-base-300 p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("pipeline.newProject", "Nuevo proyecto")}</h3>
          <button type="button" className="btn btn-sm" onClick={onClose}>
            <X size={16} /> {t("actions.close")}
          </button>
        </div>

        <label className="form-control">
          <span className="label-text">{t("common.name", "Nombre")}</span>
          <input
            className="input input-bordered"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Roof repair — Store #112"
            required
          />
        </label>

        <div className="space-y-2">
          {form.cliente_id ? (
            loadingContacts ? (
              <div className="text-xs opacity-70">Cargando contactos...</div>
            ) : contacts.length === 0 ? (
              <div className="text-xs opacity-70">Este cliente no tiene contactos.</div>
            ) : (
              <div className="rounded-lg border border-base-200 bg-base-100 max-h-40 overflow-auto">
                {contactItems.map((c) => {
                  const label = [c.nombre, c.email, c.telefono].filter(Boolean).join(" - ");
                  return (
                    <div
                      key={c.id}
                      className="px-3 py-2 hover:bg-base-200 cursor-pointer text-sm"
                      onClick={() => {
                        const picked = c.nombre || c.email || c.telefono || "";
                        setContactQuery(picked);
                        setForm({ ...form, contacto_nombre: picked });
                      }}
                    >
                      <div className="font-medium truncate">{label || "Contacto"}</div>
                      {(c.cargo || c.rol) && (
                        <div className="text-xs opacity-70">{[c.cargo, c.rol].filter(Boolean).join(" / ")}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-xs opacity-70">Selecciona un cliente para ver contactos.</div>
          )}
        </div>

        <div className="space-y-2">
          {form.cliente_id ? (
            loadingContacts ? (
              <div className="text-xs opacity-70">Cargando contactos...</div>
            ) : contacts.length === 0 ? (
              <div className="text-xs opacity-70">Este cliente no tiene contactos.</div>
            ) : (
              <div className="rounded-lg border border-base-200 bg-base-100 max-h-40 overflow-auto">
                {contactItems.map((c) => {
                  const label = [c.nombre, c.email, c.telefono].filter(Boolean).join(" - ");
                  return (
                    <div
                      key={c.id}
                      className="px-3 py-2 hover:bg-base-200 cursor-pointer text-sm"
                      onClick={() => {
                        const picked = c.nombre || c.email || c.telefono || "";
                        setContactQuery(picked);
                        setForm({ ...form, contacto_nombre: picked });
                      }}
                    >
                      <div className="font-medium truncate">{label || "Contacto"}</div>
                      {(c.cargo || c.rol) && (
                        <div className="text-xs opacity-70">{[c.cargo, c.rol].filter(Boolean).join(" / ")}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-xs opacity-70">Selecciona un cliente para ver contactos.</div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label-text">{t("common.client", "Cliente")}</span>
            <select
              className="select select-bordered"
              value={form.cliente_id}
              onChange={(e) => {
                const next = e.target.value;
                setForm({ ...form, cliente_id: next, contacto_nombre: "" });
                setContactQuery("");
              }}
            >
              <option value="">{t("common.none", "— Ninguno —")}</option>
              {(clients || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || `Cliente #${c.id}`}
                </option>
              ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text">{t("common.contact", "Contacto")}</span>
              <input
                className="input input-bordered"
                value={contactQuery}
                onChange={(e) => {
                  const next = e.target.value;
                  setContactQuery(next);
                  setForm({ ...form, contacto_nombre: next });
                }}
                placeholder="Buscar contacto..."
                disabled={!form.cliente_id}
              />
            </label>

            <label className="form-control">
              <span className="label-text">{t("common.stage", "Etapa")}</span>
              <select
                className="select select-bordered"
                value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
            >
              {stageOptions.map((s) => (
                <option key={s} value={s}>
                  {t(`common.stages.${s}`, s)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label-text">{t("common.amount", "Monto estimado")}</span>
            <input
              className="input input-bordered"
              type="number"
              min="0"
              step="0.01"
              value={form.estimate_amount}
              onChange={(e) => setForm({ ...form, estimate_amount: e.target.value })}
              placeholder="Ej: 12500"
            />
          </label>

          <label className="form-control">
            <span className="label-text">{t("common.currency", "Moneda")}</span>
            <input
              className="input input-bordered"
              value={form.estimate_currency}
              onChange={(e) => setForm({ ...form, estimate_currency: e.target.value })}
              placeholder="USD"
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label-text">{t("common.source", "Origen")}</span>
            <select
              className="select select-bordered"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              <option value="">{t("common.none", "— Ninguno —")}</option>
              {SOURCE_OPTS.map((s) => (
                <option key={s} value={s}>
                  {t(`common.sources.${s}`, s)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text">{t("common.assignee", "Responsable")}</span>
            <select
              className="select select-bordered"
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            >
              <option value="">{t("common.unassigned", "— Sin asignar —")}</option>
              {userOpts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="form-control">
          <span className="label-text">{t("common.dueDate", "Fecha límite")}</span>
          <input
            type="datetime-local"
            className="input input-bordered"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </label>

        <label className="form-control">
          <span className="label-text">{t("common.notes", "Notas")}</span>
          <textarea
            className="textarea textarea-bordered h-24"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder={t("common.notesPlaceholder", "Contexto, próximos pasos, etc.")}
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("actions.cancel", "Cancelar")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} className="mr-1" />
            {t("actions.create", "Crear")}
          </button>
        </div>
      </form>
    </div>
  );
};

const EditProjectModal = ({ open, onClose, onSaved, item, clients, pipeline, hiddenStages }) => {
  const { t } = useTranslation();
  const { options: userOpts } = useUsersOptions();
  const stageOptions = useMemo(
    () => (pipeline || PIPELINE_DEFAULT).filter((s) => !hiddenStages?.has?.(s)),
    [pipeline, hiddenStages]
  );
  const [form, setForm] = useState({
    nombre: "",
    cliente_id: "",
    stage: stageOptions[0] || PIPELINE_DEFAULT[0],
    contacto_nombre: "",
    estimate_amount: "",
    estimate_currency: "USD",
    source: "",
    assignee: "",
    descripcion: "",
    due_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactQuery, setContactQuery] = useState("");

  useEffect(() => {
    if (!open || !item) return;
    setForm({
      nombre: item.nombre || "",
      cliente_id: item.cliente_id ?? "",
      stage: item.stage && stageOptions.includes(item.stage) ? item.stage : stageOptions[0] || PIPELINE_DEFAULT[0],
      contacto_nombre: item.contacto_nombre || "",
      estimate_amount: item.estimate_amount ?? "",
      estimate_currency: item.estimate_currency || "USD",
      source: item.source || "",
      assignee: item.assignee || "",
      descripcion: item.descripcion || item.notas || "",
      due_date: item.due_date ? new Date(item.due_date).toISOString().slice(0, 16) : "",
    });
    setContactQuery(item.contacto_nombre || "");
  }, [open, item, stageOptions]);

  useEffect(() => {
    if (!open) return;
    if (!form.cliente_id) {
      setContacts([]);
      return;
    }
    (async () => {
      try {
        setLoadingContacts(true);
        const { data } = await api.get(`/clientes/${form.cliente_id}/contactos`);
        setContacts(Array.isArray(data) ? data : []);
      } catch {
        setContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    })();
  }, [open, form.cliente_id]);

  const contactItems = useMemo(() => {
    const term = contactQuery.trim().toLowerCase();
    const list = Array.isArray(contacts) ? contacts : [];
    if (!term) return list;
    return list.filter((c) =>
      [c.nombre, c.email, c.telefono, c.cargo, c.rol]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [contacts, contactQuery]);

  if (!open) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        nombre: form.nombre,
        cliente_id: form.cliente_id || null,
        stage: form.stage,
        source: form.source || null,
        assignee: form.assignee || null,
        descripcion: form.descripcion || null,
        notas: form.descripcion || null,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        estimate_amount: form.estimate_amount ? Number(form.estimate_amount) : null,
        estimate_currency: form.estimate_currency || null,
        contacto_nombre: form.contacto_nombre?.trim() || null,
      };
      const res = await api.patch(`/proyectos/${item.id}`, payload);
      if (res?.data?.ok) {
        toast.success(t("actions.update") + " OK");
        onClose();
        onSaved?.();
      } else {
        throw new Error(res?.data?.message || "update_error");
      }
    } catch (err) {
      console.error(err);
      toast.error(t("clients.toasts.updateError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4" onClick={onClose}>
      <form
        className="w-full max-w-lg rounded-2xl bg-base-100 shadow-xl border border-base-300 p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {t("actions.update")} — {item?.nombre || `#${item?.id}`}
          </h3>
          <button type="button" className="btn btn-sm" onClick={onClose}>
            <X size={16} /> {t("actions.close")}
          </button>
        </div>

        <label className="form-control">
          <span className="label-text">{t("projects.form.name", "Nombre")}</span>
          <input
            className="input input-bordered"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </label>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label-text">{t("projects.form.client", "Cliente")}</span>
            <select
              className="select select-bordered"
              value={form.cliente_id}
              onChange={(e) => {
                const next = e.target.value;
                setForm({ ...form, cliente_id: next, contacto_nombre: "" });
                setContactQuery("");
              }}
            >
              <option value="">{t("common.noData")}</option>
              {(clients || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || `Cliente #${c.id}`}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text">{t("common.contact", "Contacto")}</span>
            <input
              className="input input-bordered"
              value={contactQuery}
              onChange={(e) => {
                const next = e.target.value;
                setContactQuery(next);
                setForm({ ...form, contacto_nombre: next });
              }}
              placeholder="Buscar contacto..."
              disabled={!form.cliente_id}
            />
          </label>

          <label className="form-control">
            <span className="label-text">{t("projects.form.stage", "Etapa")}</span>
            <select
              className="select select-bordered"
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
            >
              {stageOptions.map((s) => (
                <option key={s} value={s}>
                  {t(`common.stages.${s}`, s)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label-text">{t("projects.form.amount", "Monto estimado")}</span>
            <input
              className="input input-bordered"
              type="number"
              min="0"
              step="0.01"
              value={form.estimate_amount}
              onChange={(e) => setForm({ ...form, estimate_amount: e.target.value })}
            />
          </label>
          <label className="form-control">
            <span className="label-text">{t("projects.form.currency", "Moneda")}</span>
            <input
              className="input input-bordered"
              value={form.estimate_currency}
              onChange={(e) => setForm({ ...form, estimate_currency: e.target.value })}
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label-text">{t("projects.form.source", "Origen")}</span>
            <select
              className="select select-bordered"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              <option value="">{t("common.none", "— Ninguno —")}</option>
              {SOURCE_OPTS.map((s) => (
                <option key={s} value={s}>
                  {t(`common.sources.${s}`, s)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text">{t("projects.form.assignee", "Responsable")}</span>
            <select
              className="select select-bordered"
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            >
              <option value="">{t("common.unassigned", "— Sin asignar —")}</option>
              {userOpts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="form-control">
          <span className="label-text">{t("projects.form.dueDate", "Fecha límite")}</span>
          <input
            type="datetime-local"
            className="input input-bordered"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </label>

        <label className="form-control">
          <span className="label-text">{t("projects.form.notes", "Notas")}</span>
          <textarea
            className="textarea textarea-bordered h-24"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("actions.cancel")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} className="mr-1" />
            {t("actions.update")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function ProyectosKanban() {
  const { t } = useTranslation();
  const { area } = useArea();
  const isVet = (area || "").toLowerCase() === "veterinaria";
  const pipeline = isVet ? PIPELINE_VET : PIPELINE_DEFAULT;
  const hiddenStages = isVet ? HIDDEN_VET : new Set();
  const visiblePipeline = pipeline.filter((s) => !hiddenStages.has(s));

  const [filters, setFilters] = useQueryState();
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [clientsForCreate, setClientsForCreate] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [compact, setCompact] = useState(() => {
    try {
      const v = localStorage.getItem("vex_pipeline_compact");
      return v == null ? true : v === "1";
    } catch {
      return true;
    }
  });

  const firstLoadRef = useRef(true);
  const inflightRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem("vex_pipeline_compact", compact ? "1" : "0");
    } catch {}
  }, [compact]);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await api.get("/clientes", { params: { status: "active,bid" } });
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setClientsForCreate(list);
      } catch {
        setClientsForCreate([]);
      }
    }
    fetchClients();
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, area]);

  async function reload() {
    const myReq = ++inflightRef.current;
    const showSkeleton = firstLoadRef.current || cols.length === 0;
    if (showSkeleton) setLoading(true);

    try {
      const beParams = {
        q: filters.q || undefined,
        source: filters.source || undefined,
        assignee: filters.assignee || undefined,
        only_due: filters.only_due ? 1 : undefined,
      };
      const data = await fetchProyectosKanban(beParams);
      if (myReq !== inflightRef.current) return;

      let fullClients = [];
      try {
        const res = await api.get("/clientes", { params: { status: "active,bid" } });
        fullClients = Array.isArray(res.data) ? res.data : res.data?.items || [];
      } catch {
        fullClients = [];
      }
      const byClientId = new Map(fullClients.map((c) => [c.id, c]));
      const baseOrder = data?.order?.length ? data.order : pipeline;

      let ordered = [];
      if (Array.isArray(data?.columns)) {
        const byKey = new Map(
          (data.columns || []).map((c) => {
            const key = c.key || c.title;
            const items = sortByDueCreated(
              (c.items || []).map((i) => {
                const cli = byClientId.get(i.cliente_id);
                return {
                  ...i,
                  email: i.email || cli?.email || null,
                  telefono: i.telefono || cli?.telefono || null,
                  empresa: i.empresa || cli?.nombre || null,
                  notas: i.descripcion || i.notas || null,
                };
              })
            );
            return [key, { ...c, key, items, count: items.length }];
          })
        );
        const order = baseOrder.length ? baseOrder : pipeline;
        ordered = (order.length ? order : pipeline).map(
          (k) => byKey.get(k) || { key: k, title: k, count: 0, items: [] }
        );
      } else {
        const order = baseOrder.length ? baseOrder : pipeline;
        ordered = order.map((k) => {
          const base = Array.isArray(data?.columns?.[k]) ? data.columns[k] : [];
          const items = sortByDueCreated(
            base.map((i) => {
              const cli = byClientId.get(i.cliente_id);
              return {
                ...i,
                email: i.email || cli?.email || null,
                telefono: i.telefono || cli?.telefono || null,
                empresa: i.empresa || cli?.nombre || null,
                notas: i.descripcion || i.notas || null,
              };
            })
          );
          return { key: k, title: k, items, count: items.length };
        });
      }

      ordered = ordered.filter((c) => !hiddenStages.has(c.key)).map((c) => ({ ...c, count: c.items.length }));
      if (myReq === inflightRef.current) setCols(ordered);
    } catch (err) {
      console.error(err);
      toast.error(t("pipeline.toasts.loadError"));
    } finally {
      if (myReq === inflightRef.current && (firstLoadRef.current || cols.length === 0)) {
        setLoading(false);
        firstLoadRef.current = false;
      }
    }
  }

  async function removeProyecto(item) {
    if (!item?.id) return;
    if (!confirm("Eliminar proyecto?")) return;
    try {
      await api.delete(`/proyectos/${item.id}`);
      toast.success("Proyecto eliminado");
      setDetailOpen(false);
      setEditOpen(false);
      setDetailItem(null);
      setEditItem(null);
      reload();
    } catch {
      toast.error("No pude eliminar el proyecto");
    }
  }

  const onDragStart = (e, item, fromKey) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, fromKey }));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = async (e, toKey) => {
    e.preventDefault();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (!payload.id || payload.fromKey === toKey) return;
    await doMove(payload.id, payload.fromKey, toKey);
  };

  const nextStageOf = (current) => {
    const i = visiblePipeline.indexOf(current);
    if (i < 0) return visiblePipeline[0] || pipeline[0];
    return visiblePipeline[Math.min(i + 1, visiblePipeline.length - 1)];
  };

  const doMove = async (id, fromKey, toKey) => {
    try {
      await moveProyecto(id, toKey);
      setCols((prev) => {
        const copy = prev.map((c) => ({ ...c, items: [...c.items] }));
        const from = copy.find((c) => c.key === fromKey);
        const to = copy.find((c) => c.key === toKey);
        if (!from || !to) return prev;
        const idx = from.items.findIndex((x) => x.id === id);
        if (idx >= 0) {
          const [itm] = from.items.splice(idx, 1);
          itm.categoria = toKey;
          itm.stage = toKey;
          to.items.unshift(itm);
          to.items = sortByDueCreated(to.items);
        }
        from.count = from.items.length;
        to.count = to.items.length;
        return copy;
      });
      toast.success(t("pipeline.toasts.moved", { stage: t(`common.stages.${toKey}`, toKey) }));
    } catch {
      toast.error(t("pipeline.toasts.moveError"));
    }
  };

  const colCount = cols?.length || visiblePipeline.length || pipeline.length;
  const gridStyle = { gridTemplateColumns: `repeat(${colCount}, minmax(240px,1fr))` };
  const entityLabel = isVet ? "Pipeline - Casos" : t("pipeline.titleProjects", "Pipeline - Proyectos");
  const createLabel = isVet ? "Nuevo caso" : t("actions.newProject", "Nuevo proyecto");

  if (loading) {
    return (
      <div className="p-4">
        <div className="skeleton h-9 w-56 mb-4" />
        <div className="grid gap-3" style={gridStyle}>
          {Array.from({ length: colCount }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-base-200 border border-base-300 min-h-[280px] p-3">
              <div className="skeleton h-6 w-32 mb-2" />
              <div className="skeleton h-16 w-full mb-2" />
              <div className="skeleton h-16 w-full mb-2" />
              <div className="skeleton h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stageLabel = (s) => t(`common.stages.${s}`, s);

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{entityLabel}</h1>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-1" />
            {createLabel}
          </button>
          <label className="label cursor-pointer gap-2">
            <span className="text-sm opacity-80">{t("ui.compact", "Compacto")}</span>
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={compact}
              onChange={() => setCompact((v) => !v)}
            />
          </label>
        </div>
      </div>

      <FiltersBar
        value={filters}
        onChange={setFilters}
        onClear={() => setFilters({ q: "", source: "", assignee: "", only_due: false })}
      />

      <div className="grid gap-3" style={gridStyle}>
        {cols.map((col) => (
          <Column
            key={col.key}
            title={`${stageLabel(col.key)} ${col.count ? `(${col.count})` : ""}`}
            onDrop={(e) => onDrop(e, col.key)}
          >
            {col.items.map((item) => (
              <Card
                key={item.id}
                item={item}
                compact={compact}
                onClick={() => {
                  setDetailItem(item);
                  setDetailOpen(true);
                }}
                onDragStart={(e) => onDragStart(e, item, col.key)}
                onNext={() => {
                  const next = nextStageOf(col.key);
                  if (next !== col.key) doMove(item.id, col.key, next);
                }}
                isLast={col.key === visiblePipeline[visiblePipeline.length - 1]}
              />
            ))}
          </Column>
        ))}
      </div>

      <DetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        item={detailItem}
        onEdit={(it) => {
          setDetailOpen(false);
          setEditItem(it);
          setEditOpen(true);
        }}
        onDelete={removeProyecto}
      />
      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={reload}
        clients={clientsForCreate}
        pipeline={pipeline}
        hiddenStages={hiddenStages}
      />
      <EditProjectModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={reload}
        item={editItem}
        clients={clientsForCreate}
        pipeline={pipeline}
        hiddenStages={hiddenStages}
      />
    </div>
  );
}

const Column = ({ title, children, onDrop }) => (
  <div
    className="rounded-2xl bg-base-200 border border-base-300 min-h-[280px] p-3"
    onDragOver={(e) => e.preventDefault()}
    onDrop={onDrop}
  >
    <div className="font-medium mb-2">{title}</div>
    <div className="space-y-2">{children}</div>
  </div>
);

const Card = ({ item, onDragStart, onNext, isLast, onClick, compact }) => {
  const { t } = useTranslation();
  const assignee = item.assignee_email || item.assignee || null;
  const title = item.nombre || item.email || t("common.noData");

  const chips = [
    item.source && (
      <span key="src" className={`badge badge-outline ${compact ? "badge-xs" : "badge-sm"}`}>
        {t(`common.sources.${item.source}`, item.source)}
      </span>
    ),
    assignee && (
      <span key="asg" className={`badge badge-outline ${compact ? "badge-xs" : "badge-sm"}`}>
        <UserCircle2 size={12} className="mr-1" />
        {(assignee.split?.("@")[0] || assignee)}
      </span>
    ),
    item.due_date && <DueBadge key="due" date={item.due_date} compact={compact} />,
    item.estimate_url && <EstimateChip key="est" url={item.estimate_url} compact={compact} />,
  ].filter(Boolean);

  const visible = compact ? chips.slice(0, 2) : chips;
  const overflow = chips.length - visible.length;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`cursor-pointer active:cursor-grabbing rounded-xl border border-base-300 bg-base-100 p-3 hover:shadow ${
        compact ? "py-2" : "py-3"
      }`}
      title={t("pipeline.help.cardHint")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-medium truncate ${compact ? "text-sm" : ""}`}>{title}</div>
          {item.empresa && item.nombre && (
            <div className="text-xs opacity-60 truncate flex items-center gap-1">
              <Building2 size={12} /> {item.empresa}
            </div>
          )}
        </div>
        <button
          className="btn btn-ghost btn-xs"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          disabled={isLast}
          title={isLast ? t("pipeline.help.lastStage") : t("pipeline.help.moveNext")}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {(visible.length > 0 || overflow > 0) && (
        <div className={`flex flex-wrap items-center gap-1.5 mt-2 ${compact ? "-mt-0.5" : ""}`}>
          {visible}
          {overflow > 0 && (
            <div className={`badge badge-ghost ${compact ? "badge-xs" : "badge-sm"}`} title="Más info">
              +{overflow}
            </div>
          )}
        </div>
      )}

      {(item.email || item.telefono) && (
        <div className={`grid grid-cols-2 gap-2 text-xs opacity-70 mt-2 ${compact ? "-mt-0.5" : ""}`}>
          {item.email && (
            <div className="flex items-center gap-1 truncate" title={item.email}>
              <Mail size={12} /> <span className="truncate">{item.email}</span>
            </div>
          )}
          {item.telefono && (
            <div className="flex items-center gap-1 truncate" title={item.telefono}>
              <Phone size={12} /> <span className="truncate">{item.telefono}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
