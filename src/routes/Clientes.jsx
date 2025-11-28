// src/routes/Clientes.jsx — Clientes con contactos múltiples + Activo/BID/Inactivo + edición rápida de estado
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import { Plus, X, Mail, Phone, Pencil, Trash2, Star } from "lucide-react";

/* ---------------- SlideOver genérico ---------------- */
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

/* ---------------- Contacto: fila ---------------- */
function ContactRow({ c, onEdit, onDelete, onMakePrimary }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 border rounded-xl bg-base-100">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">{c.nombre || c.email || c.telefono || "—"}</div>
          {c.es_principal ? (
            <span className="badge badge-primary badge-sm">
              <Star className="w-3 h-3 mr-1" /> Principal
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
            <Star className="w-4 h-4" /> Hacer principal
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

// ✅ COMPONENTE ContactFormInline CORREGIDO (acentos + textos limpios)
function ContactFormInline({ initial, onCancel, onSave, saving }) {
  const [f, setF] = useState({
    nombre: initial?.nombre || "",
    email: initial?.email || "",
    telefono: initial?.telefono || "",
    cargo: initial?.cargo || "",
    rol: initial?.rol || "",
    obra_social: initial?.obra_social || "",
    plan: initial?.plan || "",
    numero_afiliado: initial?.numero_afiliado || "",
    preguntas: initial?.preguntas || {},
    motivo_consulta: initial?.motivo_consulta || "",
    ultima_consulta: initial?.ultima_consulta || "",
    cepillados_diarios: initial?.cepillados_diarios || "",
    sangrado: initial?.sangrado || "",
    momentos_azucar: initial?.momentos_azucar || "",
    dolor: initial?.dolor || "",
    golpe: initial?.golpe || "",
    dificultad: initial?.dificultad || "",
    notas: initial?.notas || "",
    es_principal: !!initial?.es_principal,
  });

  const preguntasImportantes = [
    "¿Está bajo tratamiento médico?",
    "¿Sufre alguna enfermedad?",
    "¿Está tomando algún medicamento?",
    "¿Es alérgico a alguna droga, medicamentos, comida?",
    "Problemas cardíacos",
    "Diabetes",
    "Hepatitis",
    "Alteraciones en la presión sanguínea",
    "Enfermedades neurológicas",
    "Enfermedades respiratorias",
    "Anemia",
    "Convulsiones",
    "Portador de enfermedad (HIV, SIDA, HPV)",
    "Patología psiquiátrica",
    "Hemorragias en heridas",
    "Ronca o respira por boca",
    "Fuma (cantidad y tipo)",
    "Embarazada",
    "Antecedentes de cáncer",
    "Disfunción ATM",
  ];

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("pregunta_")) {
      const key = name.replace("pregunta_", "");
      setF((p) => ({
        ...p,
        preguntas: {
          ...p.preguntas,
          [key]: value,
        },
      }));
    } else {
      setF((p) => ({
        ...p,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
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
          <span className="label-text">Teléfono</span>
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
        <label className="form-control">
          <span className="label-text">Obra Social</span>
          <input name="obra_social" className="input input-bordered input-sm" value={f.obra_social} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">Plan</span>
          <input name="plan" className="input input-bordered input-sm" value={f.plan} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">N° de Afiliado</span>
          <input name="numero_afiliado" className="input input-bordered input-sm" value={f.numero_afiliado} onChange={onChange} />
        </label>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Preguntas Importantes</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {preguntasImportantes.map((p) => (
            <div key={p} className="flex flex-col">
              <span className="text-sm">{p}</span>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name={`pregunta_${p}`}
                    value="si"
                    checked={f.preguntas[p] === "si"}
                    onChange={onChange}
                  />
                  Sí
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name={`pregunta_${p}`}
                    value="no"
                    checked={f.preguntas[p] === "no"}
                    onChange={onChange}
                  />
                  No
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        <label className="form-control">
          <span className="label-text">Motivo de consulta</span>
          <input name="motivo_consulta" className="input input-bordered input-sm" value={f.motivo_consulta} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">Última consulta odontológica</span>
          <input name="ultima_consulta" className="input input-bordered input-sm" value={f.ultima_consulta} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">Cepillados diarios</span>
          <input name="cepillados_diarios" className="input input-bordered input-sm" value={f.cepillados_diarios} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">¿Tiene sangrado?</span>
          <input name="sangrado" className="input input-bordered input-sm" value={f.sangrado} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">Momentos de azúcar</span>
          <input name="momentos_azucar" className="input input-bordered input-sm" value={f.momentos_azucar} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">¿Ha tenido dolor?</span>
          <input name="dolor" className="input input-bordered input-sm" value={f.dolor} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">¿Sufrió algún golpe?</span>
          <input name="golpe" className="input input-bordered input-sm" value={f.golpe} onChange={onChange} />
        </label>
        <label className="form-control">
          <span className="label-text">¿Tiene dificultad para hablar, masticar o deglutir?</span>
          <input name="dificultad" className="input input-bordered input-sm" value={f.dificultad} onChange={onChange} />
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

/* ---------------- Página Clientes ---------------- */
export default function Clientes() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  // ✅ tabs: active | bid | inactive (default: active)
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

  // Estado de contactos (solo en edición)
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [savingContact, setSavingContact] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/clientes", { params: { status: statusTab } });
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t("clients.toasts.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [statusTab]);

  const reset = () =>
    setForm({ nombre: "", contacto_nombre: "", email: "", telefono: "", direccion: "", observacion: "" });

  function openCreate() {
    setEditing(null);
    reset();
    setContacts([]);
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
  }

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!form.nombre.trim()) return toast.error(t("clients.form.name"));

    const un = toast.loading(t("actions.sending"));
    try {
      let resp;
      if (editing?.id) {
        resp = await api.patch(`/clientes/${editing.id}`, form);
        setItems((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...resp.data } : c)));
        toast.success(t("clients.toasts.updated"));
        fetchContacts(editing.id);
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
      load();
    } catch {
      toast.error(editing?.id ? t("clients.toasts.updateError") : t("clients.toasts.cannotCreate"));
    } finally {
      toast.dismiss(un);
    }
  }

  async function remove(id) {
    if (!confirm(t("actions.confirmDelete", "¿Eliminar cliente?"))) return;
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
    const term = q.trim().toLowerCase();
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
  }, [items, q]);

  /* ------- acciones contactos ------- */
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
    if (!confirm("¿Eliminar este contacto?")) return;
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

  // 🔁 cambio rápido de estado (dropdown)
  async function updateStatus(id, next) {
    try {
      await api.patch(`/clientes/${id}`, { status: next });
      toast.success(
        `Estado: ${next === "active" ? "Activo" : next === "bid" ? "BID" : "Inactivo"}`
      );
      if (next !== statusTab) {
        // si el estado cambió de pestaña, sacamos el registro
        setItems((prev) => prev.filter((c) => c.id !== id));
      } else {
        // si quedó en la misma pestaña, refrescamos para ver el badge correcto
        load();
      }
    } catch {
      toast.error("No se pudo cambiar el estado");
    }
  }

  // Acción rápida para BID → Activo
  async function convertirAActivo(id) {
    await updateStatus(id, "active");
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("clients.title", "Clientes")}</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> {t("actions.add")}
        </button>
      </div>

      {/* Tabs Activo/BID/Inactivo */}
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
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* ---- Tabla compacta ---- */}
      <section className="card bg-base-100 shadow">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th className="px-3 py-2">{t("clients.form.name")}</th>
                  <th className="hidden md:table-cell px-3 py-2">{t("clients.form.contactName", "Contacto")}</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">{t("common.phone")}</th>
                  <th className="hidden lg:table-cell px-3 py-2">{t("clients.form.address", "Dirección")}</th>
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

      {/* SlideOver: Crear/Editar cliente + panel Contactos */}
      <SlideOver
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
          setContacts([]);
          setEditingContact(null);
          setShowAddContact(false);
        }}
        title={editing ? t("actions.update") : t("actions.add")}
      >
        {/* -------- Form Cliente -------- */}
        <form onSubmit={onSubmit} className="space-y-3 mb-6">
          <div>
            <label className="label">{t("clients.form.name")}</label>
            <input className="input input-bordered w-full" name="nombre" value={form.nombre} onChange={onChange} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t("clients.form.contactName", "Contacto")}</label>
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
              <label className="label">{t("clients.form.address", "Dirección")}</label>
              <input className="input input-bordered w-full" name="direccion" value={form.direccion} onChange={onChange} />
            </div>
          </div>

          <div>
            <label className="label">{t("clients.form.notes", "Observación")}</label>
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
                setEditingContact(null);
                setShowAddContact(false);
              }}
            >
              {t("actions.cancel")}
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? t("actions.update") : t("actions.add")}
            </button>
          </div>
        </form>

        {/* -------- Panel Contactos (solo en edición) -------- */}
        {editing?.id ? (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Contactos</h4>
              {!showAddContact ? (
                <button className="btn btn-sm" onClick={() => { setShowAddContact(true); setEditingContact(null); }}>
                  <Plus className="w-4 h-4 mr-1" /> Añadir contacto
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
              <div className="text-sm opacity-70">Sin contactos aún.</div>
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
      </SlideOver>
    </div>
  );
}
