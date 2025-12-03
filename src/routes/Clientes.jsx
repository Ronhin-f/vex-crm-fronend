// src/routes/Clientes.jsx - Clientes/Pacientes con contactos e historias clinicas
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import { Plus, X, Mail, Phone, Pencil, Trash2, Star, HeartPulse, FileUp, Bell } from "lucide-react";
import { useArea } from "../context/AreaContext";

const PREGUNTAS_IMPORTANTES = [
  { id: "alergias", label: "Alergias a medicamentos?" },
  { id: "medicacion", label: "Medicacion prolongada?" },
  { id: "embarazo", label: "Embarazo o lactancia?" },
  { id: "cardiaco", label: "Antecedentes cardiacos?" },
];

function SlideOver({ open, onClose, title, headerButtons, children, widthClass = "w-full sm:w-[540px] md:w-[760px]" }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none select-none"}`}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full bg-base-100 shadow-xl border-l border-base-200 ${widthClass}
                      transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b border-base-200 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{title}</h3>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          {headerButtons ? <div className="mt-3 flex flex-wrap gap-2">{headerButtons}</div> : null}
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-4.5rem)]">{children}</div>
      </div>
    </div>
  );
}

function SimpleModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3">
      <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-4xl border border-base-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ContactRow({ c, onEdit, onDelete, onMakePrimary, contactLabel }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 border rounded-xl bg-base-100">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">{c.nombre || c.email || c.telefono || "-"}</div>
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
          {(c.cargo || c.rol) && <div className="text-xs opacity-70">{[c.cargo, c.rol].filter(Boolean).join(" Â· ")}</div>}
          {(c.obra_social || c.plan) && (
            <div className="text-xs opacity-70">
              Cobertura: {[c.obra_social, c.plan].filter(Boolean).join(" / ")}
            </div>
          )}
          {c.numero_afiliado ? <div className="text-xs opacity-70">Afiliado: {c.numero_afiliado}</div> : null}
          {c.motivo_consulta ? <div className="text-xs opacity-70">Motivo: {c.motivo_consulta}</div> : null}
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
  const buildState = (init) => ({
    nombre: init?.nombre || "",
    email: init?.email || "",
    telefono: init?.telefono || "",
    cargo: init?.cargo || "",
    rol: init?.rol || "",
    notas: init?.notas || "",
    obra_social: init?.obra_social || "",
    plan: init?.plan || "",
    numero_afiliado: init?.numero_afiliado || "",
    motivo_consulta: init?.motivo_consulta || "",
    ultima_consulta: init?.ultima_consulta || "",
    cepillados_diarios: init?.cepillados_diarios || "",
    sangrado: init?.sangrado || "",
    momentos_azucar: init?.momentos_azucar || "",
    dolor: init?.dolor || "",
    golpe: init?.golpe || "",
    dificultad: init?.dificultad || "",
    preguntas: PREGUNTAS_IMPORTANTES.reduce((acc, q) => {
      acc[q.id] = init?.preguntas?.[q.id] || "";
      return acc;
    }, {}),
    es_principal: !!init?.es_principal,
  });
  const [f, setF] = useState(() => buildState(initial));
  const [openClinico, setOpenClinico] = useState(false);

  useEffect(() => {
    setF(buildState(initial));
  }, [initial]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("pregunta__")) {
      const key = name.replace("pregunta__", "");
      setF((p) => ({
        ...p,
        preguntas: { ...(p.preguntas || {}), [key]: value },
      }));
      return;
    }
    setF((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const hasClinicos = [
    f.obra_social,
    f.plan,
    f.numero_afiliado,
    f.motivo_consulta,
    f.ultima_consulta,
    f.cepillados_diarios,
    f.sangrado,
    f.momentos_azucar,
    f.dolor,
    f.golpe,
    f.dificultad,
    ...Object.values(f.preguntas || {}),
  ].some(Boolean);

  return (
    <form
      className="p-3 border rounded-xl bg-base-100 space-y-3"
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
          <span className="label-text">TelÃ©fono</span>
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

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-xs" onClick={() => setOpenClinico(true)}>
            <HeartPulse className="w-4 h-4" /> Datos clÃ­nicos {hasClinicos ? "â€¢" : ""}
          </button>
          {hasClinicos ? <span className="badge badge-success badge-xs">Completo</span> : null}
        </div>
      </div>

      <label className="form-control">
        <span className="label-text">Notas</span>
        <textarea name="notas" className="textarea textarea-bordered textarea-sm" value={f.notas} onChange={onChange} />
      </label>

      <label className="label cursor-pointer w-fit gap-2">
        <input
          type="checkbox"
          className="toggle toggle-sm"
          name="es_principal"
          checked={f.es_principal}
          onChange={onChange}
        />
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

      <SimpleModal open={openClinico} onClose={() => setOpenClinico(false)} title="Datos clÃ­nicos del contacto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <label className="form-control">
            <span className="label-text">Obra social</span>
            <input name="obra_social" className="input input-bordered input-sm" value={f.obra_social} onChange={onChange} />
          </label>
          <label className="form-control">
            <span className="label-text">Plan</span>
            <input name="plan" className="input input-bordered input-sm" value={f.plan} onChange={onChange} />
          </label>
          <label className="form-control">
            <span className="label-text">NÃºmero de afiliado</span>
            <input name="numero_afiliado" className="input input-bordered input-sm" value={f.numero_afiliado} onChange={onChange} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {PREGUNTAS_IMPORTANTES.map((p) => (
            <div key={p.id} className="border rounded-lg p-3">
              <div className="text-sm font-medium mb-1">{p.label}</div>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name={`pregunta__${p.id}`}
                    value="si"
                    checked={f.preguntas?.[p.id] === "si"}
                    onChange={onChange}
                  />
                  SÃ­
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name={`pregunta__${p.id}`}
                    value="no"
                    checked={f.preguntas?.[p.id] === "no"}
                    onChange={onChange}
                  />
                  No
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label-text">Motivo de consulta</span>
            <input name="motivo_consulta" className="input input-bordered input-sm" value={f.motivo_consulta} onChange={onChange} />
          </label>
          <label className="form-control">
            <span className="label-text">Ãšltima consulta odontolÃ³gica</span>
            <input name="ultima_consulta" className="input input-bordered input-sm" value={f.ultima_consulta} onChange={onChange} />
          </label>
          <label className="form-control">
            <span className="label-text">Cepillados diarios</span>
            <input name="cepillados_diarios" className="input input-bordered input-sm" value={f.cepillados_diarios} onChange={onChange} />
          </label>
          <label className="form-control">
            <span className="label-text">Â¿Tiene sangrado?</span>
            <input name="sangrado" className="input input-bordered input-sm" value={f.sangrado} onChange={onChange} />
          </label>
          <label className="form-control">
            <span className="label-text">Momentos de azÃºcar</span>
            <input name="momentos_azucar" className="input input-bordered input-sm" value={f.momentos_azucar} onChange={onChange} />
          </label>
          <label className="form-control">
            <span className="label-text">Â¿Ha tenido dolor?</span>
            <input name="dolor" className="input input-bordered input-sm" value={f.dolor} onChange={onChange} />
          </label>
          <label className="form-control">
            <span className="label-text">Â¿SufriÃ³ algÃºn golpe?</span>
            <input name="golpe" className="input input-bordered input-sm" value={f.golpe} onChange={onChange} />
          </label>
          <label className="form-control">
            <span className="label-text">Dificultad al hablar/masticar/deglutir</span>
            <input name="dificultad" className="input input-bordered input-sm" value={f.dificultad} onChange={onChange} />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpenClinico(false)}>
            Cerrar
          </button>
        </div>
      </SimpleModal>
    </form>
  );
}

/* ---------------- Badge de estado: botÃ³n simple ---------------- */
function StatusBadge({ status, onChange }) {
  const map = {
    active: { cls: "btn-success", label: "Activo" },
    bid: { cls: "btn-warning", label: "BID" },
    inactive: { cls: "btn-ghost", label: "Inactivo" },
  };

  const current = status || "active";
  const { cls, label } = map[current] || map.active;

  const order = ["active", "bid", "inactive"];

  const handleClick = () => {
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length];
    if (onChange) onChange(next);
  };

  return (
    <button type="button" className={`btn btn-xs ${cls}`} onClick={handleClick} title="Click para cambiar estado">
      {label}
    </button>
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
const LAB_FIELD_NAMES = [
  "hematocrito",
  "hemoglobina",
  "leucocitos",
  "plaquetas",
  "glucosa",
  "urea",
  "creatinina",
  "alt",
  "ast",
  "fosfatasa_alcalina",
  "proteinas_totales",
];
const LAB_VITALS = ["peso", "temperatura"];

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

function buildLabForm() {
  const base = {};
  LAB_FIELD_NAMES.forEach((f) => {
    base[f] = "";
  });
  const vitals = {};
  LAB_VITALS.forEach((k) => {
    vitals[k] = "";
  });
  return { ...base, notas: "", signos_vitales: vitals, extras: {} };
}

export default function Clientes() {
  const { t } = useTranslation();
  const { vocab, features, forms, area } = useArea();

  const clientsLabel = vocab?.clients || t("clients.title", "Clientes");
  const clientLabel = vocab?.client || t("clients.form.name", "Cliente");
  const contactLabel = vocab?.contact || t("clients.form.contactName", "Contacto");
  const contactsLabel = vocab?.contacts || "Contactos";
  const historyLabel = vocab?.clinicalHistory || "Historia clinica";
  const historyListLabel = vocab?.clinicalHistoryList || "Historias clinicas";

  const historyFields = forms?.clinicalHistory?.fields || FALLBACK_HISTORY_FIELDS;
  const vitalSigns = forms?.clinicalHistory?.vitalSigns || FALLBACK_VITALS;
  const isVet = (area || "").toLowerCase() === "veterinaria";
  const enableLabUpload = isVet && !!features?.labResults;

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [qtext, setQtext] = useState("");

  const [statusTab, setStatusTab] = useState("active");
  const [activeTab, setActiveTab] = useState("cliente");

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
  const [openContactModal, setOpenContactModal] = useState(false);
  const [contactDraft, setContactDraft] = useState(null);

  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyForm, setHistoryForm] = useState(() => buildHistoryForm(historyFields, vitalSigns));
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [labUploading, setLabUploading] = useState(false);
  const [labAttachment, setLabAttachment] = useState(null);
  const [labMatches, setLabMatches] = useState([]);
  const [labError, setLabError] = useState("");
  const [labForm, setLabForm] = useState(() => buildLabForm());
  const labEntries = useMemo(
    () => historyEntries.filter((h) => (h.tipo || "").toLowerCase() === "laboratorio"),
    [historyEntries]
  );
  const clinicalEntries = useMemo(
    () => historyEntries.filter((h) => (h.tipo || "").toLowerCase() !== "laboratorio"),
    [historyEntries]
  );
  const [openReminderModal, setOpenReminderModal] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState(() => ({
    titulo: "PrÃ³xima visita",
    mensaje: "",
    leadDays: 2,
    fecha: "",
    hora: "10:00",
  }));

  const clearHistoryForm = useCallback(() => {
    setHistoryForm(buildHistoryForm(historyFields, vitalSigns));
    setLabAttachment(null);
    setLabMatches([]);
    setLabError("");
  }, [historyFields, vitalSigns]);

  const clearLabForm = useCallback(() => {
    setLabForm(buildLabForm());
    setLabAttachment(null);
    setLabMatches([]);
    setLabError("");
  }, []);

  useEffect(() => {
    clearHistoryForm();
    clearLabForm();
  }, [historyFields, vitalSigns, features?.clinicalHistory, clearHistoryForm, clearLabForm]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/clientes", {
        params: { status: statusTab },
      });
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
    setForm({
      nombre: "",
      contacto_nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      observacion: "",
    });

  function openCreate() {
    setEditing(null);
    reset();
    setActiveTab("cliente");
    setContacts([]);
    setHistoryEntries([]);
    setOpenForm(true);
    setEditingContact(null);
    clearHistoryForm();
    clearLabForm();
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
    setActiveTab("cliente");
    setForm({
      nombre: cli.nombre || "",
      contacto_nombre: cli.contacto_nombre || "",
      email: cli.email || "",
      telefono: cli.telefono || "",
      direccion: cli.direccion || "",
      observacion: cli.observacion || "",
    });
    setOpenForm(true);
    setEditingContact(null);
    clearHistoryForm();
    clearLabForm();
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
      if (status === 409)
        toast.error(
          t(
            "clients.toasts.hasProjects",
            "No se puede borrar: tiene proyectos"
          )
        );
      else toast.error(t("clients.toasts.updateError"));
    }
  }

  const onChange = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));

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
    arr.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    return arr;
  }, [items, qtext]);

  async function createContact(clienteId, data) {
    try {
      const { data: created } = await api.post(
        `/clientes/${clienteId}/contactos`,
        data
      );
      setContacts((prev) => [created, ...prev]);
      toast.success("Contacto creado");
    } catch {
      toast.error("No se pudo crear el contacto");
    }
  }

  async function updateContact(contactId, data) {
    try {
      const { data: updated } = await api.patch(
        `/contactos/${contactId}`,
        data
      );
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? updated : c))
      );
      toast.success("Contacto actualizado");
      setEditingContact(null);
    } catch {
      toast.error("No se pudo actualizar el contacto");
    }
  }

  async function handleContactSave(data) {
    if (!editing?.id) return;
    setSavingContact(true);
    try {
      if (editingContact?.id) {
        await updateContact(editingContact.id, data);
      } else {
        await createContact(editing.id, data);
      }
      setOpenContactModal(false);
      setContactDraft(null);
      setEditingContact(null);
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
      const { data: updated } = await api.patch(`/contactos/${c.id}`, {
        es_principal: true,
      });
      setContacts((prev) =>
        prev
          .map((x) =>
            x.id === updated.id ? updated : { ...x, es_principal: false }
          )
          .sort(
            (a, b) =>
              Number(b.es_principal) - Number(a.es_principal) || b.id - a.id
          )
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
        `Estado: ${
          next === "active"
            ? "Activo"
            : next === "bid"
            ? "BID"
            : "Inactivo"
        }`
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

  function openReminderPrefill() {
    if (!editing?.nombre) return;
    const baseMsg =
      `Recordatorio: ${editing.nombre} tiene control programado. ` +
      `Motivo: ${historyForm.motivo || "seguimiento/curacion"}. ` +
      `Revisar puntos/herida y confirmar evolucion.`;
    setReminderForm((r) => ({
      ...r,
      titulo: `PrÃ³xima visita de ${editing.nombre}`,
      mensaje: baseMsg,
      fecha: "",
      hora: "10:00",
    }));
    setOpenReminderModal(true);
  }

  async function importLabFromPdf(file) {
    if (!file) return;
    setLabError("");
    setLabUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/labs/parse", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const extracted = data?.extracted || {};
      setLabForm((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(extracted.fields || {})) {
          if (LAB_FIELD_NAMES.includes(k)) next[k] = v;
          else next.extras = { ...(next.extras || {}), [k]: v };
        }
        for (const [k, v] of Object.entries(extracted.extras || {})) {
          next.extras = { ...(next.extras || {}), [k]: v };
        }
        next.signos_vitales = { ...(prev.signos_vitales || {}), ...(extracted.signos_vitales || {}) };
        return next;
      });
      setLabAttachment(data?.file || null);
      setLabMatches(extracted.matches || []);
      toast.success("Laboratorio importado. RevisÃ¡ y editÃ¡ antes de guardar.");
    } catch (e) {
      const msg = e?.response?.data?.message || "No pude leer el PDF de laboratorio";
      setLabError(msg);
      toast.error(msg);
    } finally {
      setLabUploading(false);
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
      if (labAttachment?.url) {
        extras.laboratorio_pdf = labAttachment.url;
        if (labAttachment.originalname || labAttachment.filename) {
          extras.laboratorio_archivo = labAttachment.originalname || labAttachment.filename;
        }
      }
      const finalPayload = {
        ...rest,
        signos_vitales,
        extras,
      };
      const { data } = await api.post("/historias", finalPayload);
      setHistoryEntries((prev) => [data, ...prev]);
      clearHistoryForm();
      toast.success("Historia guardada");
    } catch (e) {
      if (e?.response?.status === 403) {
        toast.error("Historias clinicas no habilitadas para esta organizacion");
      } else {
        toast.error("No pude guardar la historia");
      }
    } finally {
      setSavingHistory(false);
      setOpenHistoryModal(false);
      setLabAttachment(null);
      setLabMatches([]);
      setLabError("");
    }
  }

  async function addLabEntry() {
    if (!editing?.id) return;
    setSavingHistory(true);
    try {
      const { signos_vitales, extras: extraMap, notas, ...rest } = labForm;
      const extras = { ...(extraMap || {}) };
      LAB_FIELD_NAMES.forEach((f) => {
        if (rest[f]) extras[f] = rest[f];
      });
      if (labAttachment?.url) {
        extras.laboratorio_pdf = labAttachment.url;
        if (labAttachment.originalname || labAttachment.filename) {
          extras.laboratorio_archivo = labAttachment.originalname || labAttachment.filename;
        }
      }
      const finalPayload = {
        tipo: "laboratorio",
        motivo: "Laboratorio",
        notas: notas || "",
        cliente_id: editing.id,
        signos_vitales,
        extras,
      };
      const { data } = await api.post("/historias", finalPayload);
      setHistoryEntries((prev) => [data, ...prev]);
      clearLabForm();
      toast.success("Laboratorio guardado");
    } catch (e) {
      if (e?.response?.status === 403) {
        toast.error("Historias clinicas no habilitadas para esta organizacion");
      } else {
        toast.error("No pude guardar el laboratorio");
      }
    } finally {
      setSavingHistory(false);
    }
  }

  function buildReminderDate(form) {
    if (!form.fecha) return null;
    const [hh = "00", mm = "00"] = (form.hora || "00:00").split(":");
    const d = new Date(`${form.fecha}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`);
    if (Number.isNaN(d.getTime())) return null;
    if (form.leadDays && Number.isFinite(Number(form.leadDays))) {
      d.setDate(d.getDate() - Number(form.leadDays));
    }
    return d.toISOString();
  }

  async function saveReminder() {
    if (!editing?.id) return;
    const when = buildReminderDate(reminderForm);
    if (!when) return toast.error("Fecha/hora invÃ¡lida");
    setSavingReminder(true);
    try {
      const payload = {
        titulo: reminderForm.titulo || `PrÃ³xima visita de ${editing.nombre}`,
        mensaje: reminderForm.mensaje || "Control programado",
        enviar_en: when,
        cliente_id: editing.id,
      };
      await api.post("/recordatorios", payload);
      toast.success("Recordatorio programado");
      setOpenReminderModal(false);
    } catch (e) {
      const msg = e?.response?.data?.message || "No pude programar el recordatorio";
      toast.error(msg);
    } finally {
      setSavingReminder(false);
    }
  }

  const renderLabFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {LAB_FIELD_NAMES.map((name) => (
          <label key={name} className="form-control">
            <span className="label-text">{name.replace(/_/g, " ")}</span>
            <input
              name={name}
              type="number"
              className="input input-bordered input-sm"
              value={labForm[name] || ""}
              onChange={(e) => setLabForm((p) => ({ ...p, [name]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {LAB_VITALS.map((v) => (
          <label key={v} className="form-control">
            <span className="label-text">Signo vital: {v}</span>
            <input
              name={`lab_vital__${v}`}
              className="input input-bordered input-sm"
              value={labForm.signos_vitales?.[v] || ""}
              onChange={(e) =>
                setLabForm((p) => ({
                  ...p,
                  signos_vitales: { ...(p.signos_vitales || {}), [v]: e.target.value },
                }))
              }
            />
          </label>
        ))}
      </div>
      <label className="form-control">
        <span className="label-text">Notas</span>
        <textarea
          className="textarea textarea-bordered textarea-sm"
          value={labForm.notas || ""}
          onChange={(e) => setLabForm((p) => ({ ...p, notas: e.target.value }))}
        />
      </label>
    </div>
  );

  const renderLabList = () => {
    if (loadingHistory) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-xl" />
          ))}
        </div>
      );
    }
    if (!labEntries.length) return <div className="text-sm opacity-70">Sin laboratorios cargados.</div>;
    return (
      <div className="space-y-3">
        {labEntries.map((h) => (
          <div key={h.id} className="border rounded-xl p-3 bg-base-100">
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>{new Date(h.created_at || h.updated_at || Date.now()).toLocaleString()}</span>
              <span>{h.creado_por || "â€”"}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              {LAB_FIELD_NAMES.map((f) => {
                const val = h[f] ?? h.extras?.[f];
                return val ? (
                  <p key={f}>
                    <strong>{f.replace(/_/g, " ")}:</strong> {val}
                  </p>
                ) : null;
              })}
              {h.signos_vitales && Object.keys(h.signos_vitales).length ? (
                <p>
                  <strong>Signos vitales:</strong>{" "}
                  {Object.entries(h.signos_vitales)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" Â· ")}
                </p>
              ) : null}
              {h.extras?.laboratorio_pdf ? (
                <p>
                  <strong>PDF:</strong>{" "}
                  <a className="link" href={h.extras.laboratorio_pdf} target="_blank" rel="noreferrer">
                    Ver resultado
                  </a>
                </p>
              ) : null}
              {h.extras && Object.keys(h.extras).length ? (
                <p>
                  <strong>Datos extra:</strong>{" "}
                  {Object.entries(h.extras)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" Â· ")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  };

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
              type={f.type === "number" ? "number" : "text"}
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
    if (!clinicalEntries.length) return <div className="text-sm opacity-70">Sin registros todavia.</div>;
    return (
      <div className="space-y-3">
        {clinicalEntries.map((h) => (
          <div key={h.id} className="border rounded-xl p-3 bg-base-100">
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>{new Date(h.created_at || h.updated_at || Date.now()).toLocaleString()}</span>
              <span>{h.creado_por || "â€”"}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              {h.motivo && (
                <p>
                  <strong>Motivo:</strong> {h.motivo}
                </p>
              )}
              {h.diagnostico && (
                <p>
                  <strong>Diagnostico:</strong> {h.diagnostico}
                </p>
              )}
              {h.tratamiento && (
                <p>
                  <strong>Tratamiento:</strong> {h.tratamiento}
                </p>
              )}
              {h.indicaciones && (
                <p>
                  <strong>Indicaciones:</strong> {h.indicaciones}
                </p>
              )}
              {h.notas && (
                <p>
                  <strong>Notas:</strong> {h.notas}
                </p>
              )}
              {h.signos_vitales && Object.keys(h.signos_vitales).length ? (
                <p>
                  <strong>Signos vitales:</strong>{" "}
                  {Object.entries(h.signos_vitales)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" Â· ")}
                </p>
              ) : null}
              {h.extras && Object.keys(h.extras).length ? (
                <p>
                  <strong>Datos extra:</strong>{" "}
                  {Object.entries(h.extras)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" Â· ")}
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
          <Plus className="w-4 h-4 mr-1" /> Añadir {contactLabel.toLowerCase()}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="join rounded-xl border border-base-300 overflow-hidden">
          <button
            className={`join-item btn btn-sm ${
              statusTab === "active" ? "btn-primary" : "btn-ghost"
            }`}
            onClick={() => setStatusTab("active")}
          >
            Activos
          </button>
          <button
            className={`join-item btn btn-sm ${
              statusTab === "bid" ? "btn-primary" : "btn-ghost"
            }`}
            onClick={() => setStatusTab("bid")}
          >
            BID
          </button>
          <button
            className={`join-item btn btn-sm ${
              statusTab === "inactive" ? "btn-primary" : "btn-ghost"
            }`}
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
                  <th className="text-right pr-5 px-3 py-2">
                    {t("actions.update")}
                  </th>
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
                    <td
                      colSpan={7}
                      className="text-center opacity-70 py-6"
                    >
                      {t("clients.list.none")}
                    </td>
                  </tr>
                ) : (
                  list.map((c) => (
                    <tr key={c.id} className="align-top">
                      <td
                        onClick={() => openEdit(c)}
                        className="cursor-pointer px-3 py-2"
                      >
                        <div className="font-medium">{c.nombre}</div>
                        <div className="text-xs opacity-70">
                          {c.observacion || "â€”"}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 py-2">
                        {c.contacto_nombre || "â€”"}
                      </td>
                      <td className="px-3 py-2">{c.email || "â€”"}</td>
                      <td className="px-3 py-2">{c.telefono || "â€”"}</td>
                      <td className="hidden lg:table-cell px-3 py-2">
                        {c.direccion || "â€”"}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          status={
                            c.status ||
                            (statusTab === "bid"
                              ? "bid"
                              : statusTab === "inactive"
                              ? "inactive"
                              : "active")
                          }
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
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => openEdit(c)}
                          >
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
          setActiveTab("cliente");
          setContacts([]);
          setHistoryEntries([]);
          setEditingContact(null);
          clearHistoryForm();
          clearLabForm();
        }}
        title={editing ? t("actions.update") : t("actions.add")}
        headerButtons={
          <div className="flex flex-wrap gap-2 items-center">
            <div className="join bg-base-200 rounded-lg">
              <button
                type="button"
                className={`join-item btn btn-xs sm:btn-sm ${activeTab === "cliente" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveTab("cliente")}
              >
                DATOS
              </button>
              <button
                type="button"
                className={`join-item btn btn-xs sm:btn-sm ${activeTab === "paciente" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveTab("paciente")}
              >
                {contactsLabel.toUpperCase()}
              </button>
              <button
                type="button"
                className={`join-item btn btn-xs sm:btn-sm ${activeTab === "historia" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveTab("historia")}
              >
                HISTORIA
              </button>
              {enableLabUpload ? (
                <button
                  type="button"
                  className={`join-item btn btn-xs sm:btn-sm ${activeTab === "laboratorio" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setActiveTab("laboratorio")}
                >
                  LABS
                </button>
              ) : null}
            </div>
            {editing?.id ? (
              <button type="button" className="btn btn-outline btn-xs sm:btn-sm" onClick={openReminderPrefill}>
                <Bell className="w-4 h-4 mr-1" /> Programar recordatorio
              </button>
            ) : null}
          </div>
        }
      >
        <form onSubmit={onSubmit} className="space-y-3 mb-6">
          {activeTab === "cliente" && (
            <div className="space-y-3">
              <div>
                <label className="label">{clientLabel}</label>
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
                  <label className="label">{contactLabel}</label>
                  <input
                    className="input input-bordered w-full"
                    name="contacto_nombre"
                    value={form.contacto_nombre}
                    onChange={onChange}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">{t("clients.form.phone")}</label>
                  <input
                    className="input input-bordered w-full"
                    name="telefono"
                    value={form.telefono}
                    onChange={onChange}
                  />
                </div>
                <div>
                  <label className="label">{t("clients.form.address", "Direccion")}</label>
                  <input className="input input-bordered w-full" name="direccion" value={form.direccion} onChange={onChange} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "paciente" && (
            <div>
              <label className="label">{t("clients.form.notes", "Observacion")}</label>
              <textarea
                className="textarea textarea-bordered w-full"
                name="observacion"
                value={form.observacion}
                onChange={onChange}
              />
            </div>
          )}

          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setOpenForm(false);
                setEditing(null);
                setActiveTab("cliente");
                setContacts([]);
                setHistoryEntries([]);
                setEditingContact(null);
                clearHistoryForm();
                clearLabForm();
              }}
            >
              {t("actions.cancel")}
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? t("actions.update") : t("actions.add")}
            </button>
          </div>
        </form>

        {editing?.id && activeTab === "paciente" ? (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{contactsLabel}</h4>
              <button
                className="btn btn-sm"
                onClick={() => {
                  setContactDraft(null);
                  setEditingContact(null);
                  setOpenContactModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Añadir {contactLabel.toLowerCase()}
              </button>
            </div>

            {loadingContacts ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-sm opacity-70">Sin {contactsLabel.toLowerCase()} aún.</div>
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <ContactRow
                    key={c.id}
                    c={c}
                    contactLabel={contactLabel}
                    onEdit={(ci) => {
                      setEditingContact(ci);
                      setContactDraft(ci);
                      setOpenContactModal(true);
                    }}
                    onDelete={deleteContact}
                    onMakePrimary={makePrimary}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}
        {activeTab === "historia" ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{historyListLabel}</h4>
              {editing?.id && features?.clinicalHistory ? (
                <button className="btn btn-outline btn-xs" onClick={() => setOpenHistoryModal(true)}>
                  Nueva entrada
                </button>
              ) : null}
            </div>
            {editing?.id && features?.clinicalHistory ? (
              renderHistoryList()
            ) : (
              <div className="text-sm opacity-70">GuardÃ¡ el paciente para ver historias clÃ­nicas.</div>
            )}
          </section>
        ) : null}

        {activeTab === "laboratorio" && enableLabUpload ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Resultados de laboratorio</h4>
            </div>
            {editing?.id ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-dashed border-base-300 p-3 bg-base-200/60 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm">Subir PDF</p>
                      <p className="text-xs opacity-70">Autocompleta valores al detectar analitos.</p>
                    </div>
                    <label className={`btn btn-outline btn-sm ${labUploading ? "loading" : ""}`}>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) importLabFromPdf(f);
                          e.target.value = "";
                        }}
                      />
                      <FileUp className="w-4 h-4 mr-1" /> {labUploading ? "Procesando..." : "Importar PDF"}
                    </label>
                  </div>
                  {labAttachment ? (
                    <div className="text-xs opacity-80">
                      Adjunto: {labAttachment.originalname || labAttachment.filename}
                    </div>
                  ) : null}
                  {labMatches?.length ? (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {labMatches.map((m, i) => (
                        <span key={`${m.target}-${i}`} className="badge badge-outline">
                          {m.target}: {m.value}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {labError ? <div className="text-xs text-error">{labError}</div> : null}
                </div>

                {renderLabFields()}

                <div className="flex justify-end gap-2">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={clearLabForm}>
                    Limpiar
                  </button>
                  <button
                    className={`btn btn-primary btn-sm ${savingHistory ? "btn-disabled" : ""}`}
                    onClick={addLabEntry}
                  >
                    Guardar laboratorio
                  </button>
                </div>

                <div className="divider">Cargados</div>
                {renderLabList()}
              </div>
            ) : (
              <div className="text-sm opacity-70">GuardÃ¡ el paciente para adjuntar laboratorios.</div>
            )}
          </section>
        ) : null}
      </SlideOver>

      <SimpleModal
        open={openContactModal}
        onClose={() => {
          setOpenContactModal(false);
          setContactDraft(null);
          setEditingContact(null);
        }}
        title={`Guardar ${contactLabel}`}
      >
        <ContactFormInline
          initial={contactDraft}
          saving={savingContact}
          onCancel={() => {
            setOpenContactModal(false);
            setContactDraft(null);
            setEditingContact(null);
          }}
          onSave={handleContactSave}
        />
      </SimpleModal>

      <SimpleModal open={openHistoryModal} onClose={() => setOpenHistoryModal(false)} title={`Guardar ${historyLabel}`}>
        <div className="rounded-xl border border-base-200 p-3 bg-base-100 space-y-3">
          {renderHistoryFields()}
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost btn-sm" onClick={clearHistoryForm}>
              Limpiar
            </button>
            <button className={`btn btn-primary btn-sm ${savingHistory ? "btn-disabled" : ""}`} onClick={addHistoryEntry}>
              Guardar {historyLabel.toLowerCase()}
            </button>
          </div>
        </div>
      </SimpleModal>

      <SimpleModal open={openReminderModal} onClose={() => setOpenReminderModal(false)} title="Programar recordatorio">
        <div className="space-y-3">
          <label className="form-control">
            <span className="label-text">Titulo</span>
            <input
              className="input input-bordered input-sm"
              value={reminderForm.titulo}
              onChange={(e) => setReminderForm((p) => ({ ...p, titulo: e.target.value }))}
            />
          </label>
          <label className="form-control">
            <span className="label-text">Mensaje</span>
            <textarea
              className="textarea textarea-bordered textarea-sm"
              rows={4}
              value={reminderForm.mensaje}
              onChange={(e) => setReminderForm((p) => ({ ...p, mensaje: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="form-control">
              <span className="label-text">Fecha de visita</span>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={reminderForm.fecha}
                onChange={(e) => setReminderForm((p) => ({ ...p, fecha: e.target.value }))}
              />
            </label>
            <label className="form-control">
              <span className="label-text">Hora</span>
              <input
                type="time"
                className="input input-bordered input-sm"
                value={reminderForm.hora}
                onChange={(e) => setReminderForm((p) => ({ ...p, hora: e.target.value }))}
              />
            </label>
            <label className="form-control">
              <span className="label-text">Avisar dÃ­as antes</span>
              <select
                className="select select-bordered select-sm"
                value={reminderForm.leadDays}
                onChange={(e) => setReminderForm((p) => ({ ...p, leadDays: Number(e.target.value) }))}
              >
                {[0, 1, 2, 3, 5, 7].map((d) => (
                  <option key={d} value={d}>
                    {d === 0 ? "Mismo dÃ­a" : `${d} dÃ­a(s) antes`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setOpenReminderModal(false)}>
              Cancelar
            </button>
            <button className={`btn btn-primary btn-sm ${savingReminder ? "btn-disabled" : ""}`} onClick={saveReminder}>
              Programar
            </button>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}






















