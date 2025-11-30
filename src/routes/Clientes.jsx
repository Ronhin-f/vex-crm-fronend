// src/routes/Clientes.jsx — Clientes/Pacientes con contactos e historias clinicas
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import { Plus, X, Mail, Phone, Pencil, Trash2, Star, HeartPulse } from "lucide-react";
import { useArea } from "../context/AreaContext";

function SlideOver({ open, onClose, title, children, widthClass = "w-full sm:w-[540px] md:w-[760px]" }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none select-none"}`}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full bg-base-100 shadow-xl border-l border-base-200 ${widthClass}
                      transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog" aria-modal="true"
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

function ContactRow({ c, onEdit, onDelete, onMakePrimary, contactLabel }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 border rounded-xl bg-base-100">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">{c.nombre || c.email || c.telefono || "—"}</div>
          {c.es_principal ? (
            <span className="badge badge-primary badge-sm">
              <Star className="w-3 h-3 mr-1" /> {contactLabel || "Principal"}
            </span>
          ) : null}
        </div>
        <div className="mt-1 text-sm opacity-80 space-y-0.5">
          {c.email ? (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> <span className="truncate">{c.email}</span>
            </div>
          ) : null}
          {c.telefono ? (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> <span className="truncate">{c.telefono}</span>
            </div>
          ) : null}
          {(c.cargo || c.rol) && <div className="text-xs opacity-70">{[c.cargo, c.rol].filter(Boolean).join(" · ")}</div>}
          {c.notas ? <div className="text-xs opacity-70 whitespace-pre-wrap">{c.notas}</div> : null}
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1">
        {!c.es_principal && (
          <button className="btn btn-ghost btn-xs" onClick={() => onMakePrimary(c)}>
            <Star className="w-4 h-4" /> Principal
          </button>
        )}
        <button className="btn btn-ghost btn-xs" onClick={() => onEdit(c)}>
          <Pencil className="w-4 h-4" /> Editar
        </button>
        <button className="btn btn-ghost btn-xs text-error" onClick={() => onDelete(c)}>
          <Trash2 className="w-4 h-4" /> Borrar
        </button>
      </div>
    </div>
  );
}

function ContactFormInline({ initial, onCancel, onSave, saving }) {
  const [f, setF] = useState({
    nombre: initial?.nombre || "",
    email: initial?.email || "",
    telefono: initial?.telefono || "",
    cargo: initial?.cargo || "",
    rol: initial?.rol || "",
    notas: initial?.notas || "",
    es_principal: !!initial?.es_principal,
  });

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setF((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <form
      className="p-3 border rounded-xl bg-base-100 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="form-control">
          <span className="label-text">Nombre</span>
          <input name="nombre" className="input input-bordered input-sm" value={f.nombre} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">Email</span>
          <input name="email" type="email" className="input input-bordered input-sm" value={f.email} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">Telefono</span>
          <input name="telefono" className="input input-bordered input-sm" value={f.telefono} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">Cargo</span>
          <input name="cargo" className="input input-bordered input-sm" value={f.cargo} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">Rol</span>
          <input name="rol" className="input input-bordered input-sm" value={f.rol} onChange={onChange} />
        </label>
      </div>

      <label className="form-control">
        <span className="label-text">Notas</span>
        <textarea name="notas" className="textarea textarea-bordered textarea-sm" value={f.notas} onChange={onChange} />
      </label>

      <label className="label cursor-pointer w-fit gap-2">
        <input type="checkbox" className="toggle toggle-sm" name="es_principal" checked={f.es_principal} onChange={onChange} />
        <span className="label-text">Marcar como principal</span>
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={`btn btn-primary btn-sm ${saving ? "btn-disabled" : ""}`}>
          Guardar
        </button>
      </div>
    </form>
  );
}

function StatusBadge({ status, onChange }) {
  const map = {
    active: { cls: "badge-success", label: "Activo" },
    bid: { cls: "badge-warning", label: "BID" },
    inactive: { cls: "badge-ghost", label: "Inactivo" },
  };
  const { cls, label } = map[status] || map.active;

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className={`badge ${cls} badge-sm cursor-pointer`}>{label}</label>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
        {Object.entries(map).map(([key, v]) => (
          <li key={key}>
            <button onClick={() => onChange(key)} className="justify-between">
              {v.label} {key === status ? "✓" : ""}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FALLBACK_HISTORY_FIELDS = [
  { name: "motivo", label: "Motivo de consulta", type: "text" },
  { name: "diagnostico", label: "Diagnostico", type: "textarea" },
  { name: "tratamiento", label: "Plan / Tratamiento", type: "textarea" },
  { name: "indicaciones", label: "Indicaciones", type: "textarea" },
  { name: "notas", label: "Notas", type: "textarea" },
];
const FALLBACK_VITALS = [];

function buildHistoryForm(fields, vitalSigns) {
  const base = {};
  (fields || []).forEach((f) => {
    base[f.name] = "";
  });
  const vitals = {};
  (vitalSigns || []).forEach((k) => {
    vitals[k] = "";
  });
  return { ...base, signos_vitales: vitals };
}

export default function Clientes() {
  const { t } = useTranslation();
  const { vocab, features, forms } = useArea();

  const clientsLabel = vocab?.clients || t("clients.title", "Clientes");
  const clientLabel = vocab?.client || t("clients.form.name", "Cliente");
  const contactLabel = vocab?.contact || t("clients.form.contactName", "Contacto");
  const contactsLabel = vocab?.contacts || "Contactos";
  const historyLabel = vocab?.clinicalHistory || "Historia clinica";
  const historyListLabel = vocab?.clinicalHistoryList || "Historias clinicas";

  const historyFields = forms?.clinicalHistory?.fields || FALLBACK_HISTORY_FIELDS;
  const vitalSigns = forms?.clinicalHistory?.vitalSigns || FALLBACK_VITALS;

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [qtext, setQtext] = useState("");

  const [statusTab, setStatusTab] = useState("active");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    contacto_nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    observacion: "",
  });

  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [savingContact, setSavingContact] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyForm, setHistoryForm] = useState(() => buildHistoryForm(historyFields, vitalSigns));
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);

  useEffect(() => {
    setHistoryForm(buildHistoryForm(historyFields, vitalSigns));
  }, [historyFields, vitalSigns, features?.clinicalHistory]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/clientes", { params: { status: statusTab } });
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t("clients.toasts.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [statusTab, t]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () =>
    setForm({ nombre: "", contacto_nombre: "", email: "", telefono: "", direccion: "", observacion: "" });

  function openCreate() {
    setEditing(null);
    reset();
    setContacts([]);
    setHistoryEntries([]);
    setOpenForm(true);
    setShowAddContact(false);
    setEditingContact(null);
  }

  async function fetchContacts(clienteId) {
    setLoadingContacts(true);
    try {
      const { data } = await api.get(`/clientes/${clienteId}/contactos`);
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }

  async function fetchHistory(clienteId) {
    if (!features?.clinicalHistory) return;
    setLoadingHistory(true);
    try {
      const { data } = await api.get("/historias", { params: { cliente_id: clienteId } });
      setHistoryEntries(Array.isArray(data) ? data : []);
    } catch {
      setHistoryEntries([]);
      toast.error("No pude cargar historias clinicas");
    } finally {
      setLoadingHistory(false);
    }
  }

  async function openEdit(cli) {
    setEditing(cli);
    setForm({
      nombre: cli.nombre || "",
      contacto_nombre: cli.contacto_nombre || "",
      email: cli.email || "",
      telefono: cli.telefono || "",
      direccion: cli.direccion || "",
      observacion: cli.observacion || "",
    });
    setOpenForm(true);
    setShowAddContact(false);
    setEditingContact(null);
    await fetchContacts(cli.id);
    if (features?.clinicalHistory) {
      fetchHistory(cli.id);
    } else {
      setHistoryEntries([]);
    }
  }

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!form.nombre.trim()) return toast.error(`${clientLabel}: requerido`);

    const un = toast.loading(t("actions.sending"));
    try {
      let resp;
      if (editing?.id) {
        resp = await api.patch(`/clientes/${editing.id}`, form);
        setItems((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...resp.data } : c)));
        toast.success(t("clients.toasts.updated"));
        fetchContacts(editing.id);
        if (features?.clinicalHistory) fetchHistory(editing.id);
      } else {
        const payload =
          statusTab === "bid"
            ? { ...form, status: "bid" }
            : statusTab === "inactive"
            ? { ...form, status: "inactive" }
            : form;
        resp = await api.post("/clientes", payload);
        if (payload.status) setItems((prev) => [resp.data, ...prev]);
        toast.success(t("clients.toasts.created"));
      }
      setOpenForm(false);
      setEditing(null);
      reset();
      setContacts([]);
      setHistoryEntries([]);
    } catch {
      toast.error(editing?.id ? t("clients.toasts.updateError") : t("clients.toasts.cannotCreate"));
    } finally {
      toast.dismiss(un);
    }
  }

  async function remove(id) {
    if (!confirm(t("actions.confirmDelete", `Eliminar ${clientLabel.toLowerCase()}?`))) return;
    try {
      await api.delete(`/clientes/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success(t("actions.deleted", "Eliminado"));
    } catch (e) {
      const status = e?.response?.status;
      if (status === 409) toast.error(t("clients.toasts.hasProjects", "No se puede borrar: tiene proyectos"));
      else toast.error(t("clients.toasts.updateError"));
    }
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const list = useMemo(() => {
    const term = qtext.trim().toLowerCase();
    let arr = [...items];
    if (term) {
      arr = arr.filter((c) =>
        [c.nombre, c.contacto_nombre, c.email, c.telefono, c.direccion]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );
    }
    arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return arr;
  }, [items, qtext]);

  async function createContact(clienteId, data) {
    setSavingContact(true);
    try {
      const { data: created } = await api.post(`/clientes/${clienteId}/contactos`, data);
      setContacts((prev) => [created, ...prev]);
      toast.success("Contacto creado");
      setShowAddContact(false);
    } catch {
      toast.error("No se pudo crear el contacto");
    } finally {
      setSavingContact(false);
    }
  }

  async function updateContact(contactId, data) {
    setSavingContact(true);
    try {
      const { data: updated } = await api.patch(`/contactos/${contactId}`, data);
      setContacts((prev) => prev.map((c) => (c.id === contactId ? updated : c)));
      toast.success("Contacto actualizado");
      setEditingContact(null);
    } catch {
      toast.error("No se pudo actualizar el contacto");
    } finally {
      setSavingContact(false);
    }
  }

  async function deleteContact(c) {
    if (!confirm(`Eliminar este ${contactLabel.toLowerCase()}?`)) return;
    try {
      await api.delete(`/contactos/${c.id}`);
      setContacts((prev) => prev.filter((x) => x.id !== c.id));
      toast.success("Contacto eliminado");
    } catch {
      toast.error("No se pudo eliminar el contacto");
    }
  }

  async function makePrimary(c) {
    try {
      const { data: updated } = await api.patch(`/contactos/${c.id}`, { es_principal: true });
      setContacts((prev) =>
        prev
          .map((x) => (x.id === updated.id ? updated : { ...x, es_principal: false }))
          .sort((a, b) => Number(b.es_principal) - Number(a.es_principal) || b.id - a.id)
      );
      toast.success("Marcado como principal");
    } catch {
      toast.error("No se pudo marcar como principal");
    }
  }

  async function updateStatus(id, next) {
    try {
      await api.patch(`/clientes/${id}`, { status: next });
      toast.success(
        `Estado: ${next === "active" ? "Activo" : next === "bid" ? "BID" : "Inactivo"}`
      );
      if (next !== statusTab) {
        setItems((prev) => prev.filter((c) => c.id !== id));
      } else {
        load();
      }
    } catch {
      toast.error("No se pudo cambiar el estado");
    }
  }

  async function convertirAActivo(id) {
    await updateStatus(id, "active");
  }

  function onChangeHistory(e) {
    const { name, value } = e.target;
    if (name.startsWith("vital__")) {
      const key = name.replace("vital__", "");
      setHistoryForm((p) => ({
        ...p,
        signos_vitales: { ...(p.signos_vitales || {}), [key]: value },
      }));
    } else {
      setHistoryForm((p) => ({ ...p, [name]: value }));
    }
  }

  async function addHistoryEntry() {
    if (!editing?.id) return;
    setSavingHistory(true);
    try {
      const payload = { ...historyForm, cliente_id: editing.id };
      const { signos_vitales, ...rest } = payload;
      const extras = {};
      const allowed = new Set(["motivo", "diagnostico", "tratamiento", "indicaciones", "notas", "sintomas", "animal", "vacunas"]);
      for (const f of historyFields) {
        if (!allowed.has(f.name)) {
          extras[f.name] = payload[f.name];
        }
      }
      const finalPayload = {
        ...rest,
        signos_vitales,
        extras,
      };
      const { data } = await api.post("/historias", finalPayload);
      setHistoryEntries((prev) => [data, ...prev]);
      setHistoryForm(buildHistoryForm(historyFields, vitalSigns));
      toast.success("Historia guardada");
    } catch (e) {
      if (e?.response?.status === 403) {
        toast.error("Historias clinicas no habilitadas para esta organizacion");
      } else {
        toast.error("No pude guardar la historia");
      }
    } finally {
      setSavingHistory(false);
    }
  }

  const renderHistoryFields = () => (
    <div className="space-y-3">
      {historyFields.map((f) => (
        <label key={f.name} className="form-control">
          <span className="label-text">{f.label}</span>
          {f.type === "textarea" ? (
            <textarea
              name={f.name}
              className="textarea textarea-bordered textarea-sm"
              value={historyForm[f.name] || ""}
              onChange={onChangeHistory}
            />
          ) : (
            <input
              name={f.name}
              className="input input-bordered input-sm"
              value={historyForm[f.name] || ""}
              onChange={onChangeHistory}
            />
          )}
        </label>
      ))}

      {vitalSigns.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {vitalSigns.map((v) => (
            <label key={v} className="form-control">
              <span className="label-text">Signo vital: {v}</span>
              <input
                name={`vital__${v}`}
                className="input input-bordered input-sm"
                value={historyForm.signos_vitales?.[v] || ""}
                onChange={onChangeHistory}
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );

  const renderHistoryList = () => {
    if (loadingHistory) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-xl" />
          ))}
        </div>
      );
    }
    if (!historyEntries.length) return <div className="text-sm opacity-70">Sin registros todavia.</div>;
    return (
      <div className="space-y-3">
        {historyEntries.map((h) => (
          <div key={h.id} className="border rounded-xl p-3 bg-base-100">
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>{new Date(h.created_at || h.updated_at || Date.now()).toLocaleString()}</span>
              <span>{h.creado_por || "—"}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              {h.motivo && <p><strong>Motivo:</strong> {h.motivo}</p>}
              {h.diagnostico && <p><strong>Diagnostico:</strong> {h.diagnostico}</p>}
              {h.tratamiento && <p><strong>Tratamiento:</strong> {h.tratamiento}</p>}
              {h.indicaciones && <p><strong>Indicaciones:</strong> {h.indicaciones}</p>}
              {h.notas && <p><strong>Notas:</strong> {h.notas}</p>}
              {h.signos_vitales && Object.keys(h.signos_vitales).length ? (
                <p>
                  <strong>Signos vitales:</strong>{" "}
                  {Object.entries(h.signos_vitales)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </p>
              ) : null}
              {h.extras && Object.keys(h.extras).length ? (
                <p>
                  <strong>Datos extra:</strong>{" "}
                  {Object.entries(h.extras)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{clientsLabel}</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> {t("actions.add")}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="join rounded-xl border border-base-300 overflow-hidden">
          <button
            className={`join-item btn btn-sm ${statusTab === "active" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setStatusTab("active")}
          >
            Activos
          </button>
          <button
            className={`join-item btn btn-sm ${statusTab === "bid" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setStatusTab("bid")}
          >
            BID
          </button>
          <button
            className={`join-item btn btn-sm ${statusTab === "inactive" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setStatusTab("inactive")}
          >
            Inactivos
          </button>
        </div>

        <input
          className="input input-bordered input-sm w-full max-w-md"
          placeholder={t("common.search", "Buscar...")}
          value={qtext}
          onChange={(e) => setQtext(e.target.value)}
        />
      </div>

      <section className="card bg-base-100 shadow">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th className="px-3 py-2">{clientLabel}</th>
                  <th className="hidden md:table-cell px-3 py-2">{contactLabel}</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">{t("common.phone")}</th>
                  <th className="hidden lg:table-cell px-3 py-2">{t("clients.form.address", "Direccion")}</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="text-right pr-5 px-3 py-2">{t("actions.update")}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-3 py-2">
                        <div className="skeleton h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center opacity-70 py-6">
                      {t("clients.list.none")}
                    </td>
                  </tr>
                ) : (
                  list.map((c) => (
                    <tr key={c.id} className="align-top">
                      <td onClick={() => openEdit(c)} className="cursor-pointer px-3 py-2">
                        <div className="font-medium">{c.nombre}</div>
                        <div className="text-xs opacity-70">{c.observacion || "—"}</div>
                      </td>
                      <td className="hidden md:table-cell px-3 py-2">{c.contacto_nombre || "—"}</td>
                      <td className="px-3 py-2">{c.email || "—"}</td>
                      <td className="px-3 py-2">{c.telefono || "—"}</td>
                      <td className="hidden lg:table-cell px-3 py-2">{c.direccion || "—"}</td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          status={c.status || (statusTab === "bid" ? "bid" : statusTab === "inactive" ? "inactive" : "active")}
                          onChange={(next) => updateStatus(c.id, next)}
                        />
                      </td>
                      <td className="text-right pr-5 px-3 py-2">
                        <div className="flex justify-end gap-2">
                          {statusTab === "bid" ? (
                            <button
                              className="btn btn-ghost btn-xs text-success"
                              onClick={() => convertirAActivo(c.id)}
                            >
                              Convertir a Activo
                            </button>
                          ) : null}
                          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(c)}>
                            {t("actions.update")}
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => remove(c.id)}
                          >
                            {t("actions.delete", "Eliminar")}
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
      </section>

      <SlideOver
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
          setContacts([]);
          setHistoryEntries([]);
          setEditingContact(null);
          setShowAddContact(false);
          setHistoryForm(buildHistoryForm(historyFields, vitalSigns));
        }}
        title={editing ? t("actions.update") : t("actions.add")}
      >
        <form onSubmit={onSubmit} className="space-y-3 mb-6">
          <div>
            <label className="label">{clientLabel}</label>
            <input className="input input-bordered w-full" name="nombre" value={form.nombre} onChange={onChange} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{contactLabel}</label>
              <input className="input input-bordered w-full" name="contacto_nombre" value={form.contacto_nombre} onChange={onChange} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input input-bordered w-full" name="email" value={form.email} onChange={onChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t("clients.form.phone")}</label>
              <input className="input input-bordered w-full" name="telefono" value={form.telefono} onChange={onChange} />
            </div>
            <div>
              <label className="label">{t("clients.form.address", "Direccion")}</label>
              <input className="input input-bordered w-full" name="direccion" value={form.direccion} onChange={onChange} />
            </div>
          </div>

          <div>
            <label className="label">{t("clients.form.notes", "Observacion")}</label>
            <textarea className="textarea textarea-bordered w-full" name="observacion" value={form.observacion} onChange={onChange} />
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setOpenForm(false);
                setEditing(null);
                setContacts([]);
                setHistoryEntries([]);
                setEditingContact(null);
                setShowAddContact(false);
                setHistoryForm(buildHistoryForm(historyFields, vitalSigns));
              }}
            >
              {t("actions.cancel")}
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? t("actions.update") : t("actions.add")}
            </button>
          </div>
        </form>

        {editing?.id ? (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{contactsLabel}</h4>
              {!showAddContact ? (
                <button className="btn btn-sm" onClick={() => { setShowAddContact(true); setEditingContact(null); }}>
                  <Plus className="w-4 h-4 mr-1" /> Anadir {contactLabel.toLowerCase()}
                </button>
              ) : null}
            </div>

            {showAddContact && (
              <div className="mb-3">
                <ContactFormInline
                  initial={null}
                  saving={savingContact}
                  onCancel={() => setShowAddContact(false)}
                  onSave={(f) => createContact(editing.id, f)}
                />
              </div>
            )}

            {loadingContacts ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-sm opacity-70">Sin {contactsLabel.toLowerCase()} aun.</div>
            ) : (
              <div className="space-y-2">
                {contacts.map((c) =>
                  editingContact?.id === c.id ? (
                    <ContactFormInline
                      key={c.id}
                      initial={editingContact}
                      saving={savingContact}
                      onCancel={() => setEditingContact(null)}
                      onSave={(f) => updateContact(c.id, f)}
                    />
                  ) : (
                    <ContactRow
                      key={c.id}
                      c={c}
                      contactLabel={contactLabel}
                      onEdit={(ci) => setEditingContact(ci)}
                      onDelete={deleteContact}
                      onMakePrimary={makePrimary}
                    />
                  )
                )}
              </div>
            )}
          </section>
        ) : null}

        {editing?.id && features?.clinicalHistory ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{historyListLabel}</h4>
            </div>
            <div className="rounded-xl border border-base-200 p-3 bg-base-100 space-y-3">
              {renderHistoryFields()}
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setHistoryForm(buildHistoryForm(historyFields, vitalSigns))}>
                  Limpiar
                </button>
                <button className={`btn btn-primary btn-sm ${savingHistory ? "btn-disabled" : ""}`} onClick={addHistoryEntry}>
                  Guardar {historyLabel.toLowerCase()}
                </button>
              </div>
            </div>
            {renderHistoryList()}
          </section>
        ) : null}
      </SlideOver>
    </div>
  );
}
