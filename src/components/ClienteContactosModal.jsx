import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, User, Mail, Phone, Star, Trash2, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../utils/api";

function Row({ c, onEdit, onDelete, onMakePrimary }) {
  const { t } = useTranslation();
  return (
    <tr>
      <td>
        <div className="font-medium flex items-center gap-1">
          <User size={14} /> {c.nombre || "—"}
          {c.es_principal ? (
            <span className="badge badge-success badge-xs ml-2">{t("contacts.primary")}</span>
          ) : null}
        </div>
        {c.cargo && <div className="text-xs opacity-70">{c.cargo}</div>}
      </td>
      <td className="whitespace-pre-wrap">{c.email || "—"}</td>
      <td>{c.telefono || "—"}</td>
      <td className="hidden lg:table-cell">{c.rol || "—"}</td>
      <td className="hidden lg:table-cell">{c.notas || "—"}</td>
      <td className="text-right">
        <div className="flex justify-end gap-2">
          {!c.es_principal && (
            <button className="btn btn-ghost btn-xs" onClick={() => onMakePrimary(c.id)}>
              <Star size={14} /> {t("contacts.makePrimary")}
            </button>
          )}
          <button className="btn btn-ghost btn-xs" onClick={() => onEdit(c)}>{t("actions.update")}</button>
          <button className="btn btn-ghost btn-xs text-error" onClick={() => onDelete(c.id)}>
            <Trash2 size={14} /> {t("actions.delete")}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ClienteContactosModal({ open, onClose, cliente }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: "", email: "", telefono: "", cargo: "", rol: "", notas: "", es_principal: false,
  });
  const [saving, setSaving] = useState(false);

  // cargar contactos del cliente
  useEffect(() => {
    if (!open || !cliente?.id) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/clientes/${cliente.id}/contactos`);
        setItems(Array.isArray(data) ? data : []);
      } catch {
        toast.error(t("contacts.toasts.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, cliente?.id, t]);

  function startCreate() {
    setEditing(null);
    setForm({ nombre: "", email: "", telefono: "", cargo: "", rol: "", notas: "", es_principal: items.length === 0 });
  }
  function startEdit(c) {
    setEditing(c);
    setForm({
      nombre: c.nombre || "", email: c.email || "", telefono: c.telefono || "",
      cargo: c.cargo || "", rol: c.rol || "", notas: c.notas || "", es_principal: !!c.es_principal,
    });
  }
  function onChange(e) { const { name, value, type, checked } = e.target; setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value })); }

  async function save(e) {
    e?.preventDefault();
    setSaving(true);
    try {
      let resp;
      if (editing?.id) {
        resp = await api.patch(`/contactos/${editing.id}`, { ...form });
        setItems(list => list.map(x => (x.id === editing.id ? resp.data : x)));
        toast.success(t("contacts.toasts.updated"));
      } else {
        resp = await api.post(`/clientes/${cliente.id}/contactos`, { ...form });
        setItems(list => [resp.data, ...list]);
        toast.success(t("contacts.toasts.created"));
      }
      setEditing(null);
      startCreate();
    } catch {
      toast.error(editing ? t("contacts.toasts.updateError") : t("contacts.toasts.createError"));
    } finally {
      setSaving(false);
    }
  }

  async function del(id) {
    if (!confirm(t("contacts.confirmDelete"))) return;
    try {
      await api.delete(`/contactos/${id}`);
      setItems(list => list.filter(x => x.id !== id));
      toast.success(t("contacts.toasts.deleted"));
    } catch {
      toast.error(t("contacts.toasts.deleteError"));
    }
  }

  async function makePrimary(id) {
    try {
      // cualquier de estas 2 te sirve según tu BE:
      // await api.post(`/contactos/${id}/principal`);
      await api.patch(`/contactos/${id}`, { es_principal: true });
      setItems(list => list.map(x => ({ ...x, es_principal: x.id === id })));
      toast.success(t("contacts.toasts.madePrimary"));
    } catch {
      toast.error(t("contacts.toasts.updateError"));
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(c =>
      [c.nombre, c.email, c.telefono, c.cargo, c.rol, c.notas]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(term))
    );
  }, [items, q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[760px] bg-base-100 border-l border-base-200 shadow-xl">
        <div className="px-4 py-3 border-b border-base-200 flex items-center justify-between">
          <h3 className="font-semibold">
            {t("contacts.title")} — <span className="opacity-70">{cliente?.nombre || `#${cliente?.id}`}</span>
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100%-3.25rem)]">
          {/* Formulario */}
          <form className="space-y-3 lg:col-span-1" onSubmit={save}>
            <div className="flex items-center justify-between">
              <div className="font-medium">{editing ? t("actions.update") : t("actions.add")}</div>
              <button type="button" className="btn btn-ghost btn-xs" onClick={startCreate}><Plus size={14} /> {t("contacts.new")}</button>
            </div>

            <label className="form-control">
              <span className="label-text">{t("contacts.fields.name")}</span>
              <input className="input input-bordered" name="nombre" value={form.nombre} onChange={onChange} required />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text">Email</span>
                <input className="input input-bordered" name="email" value={form.email} onChange={onChange} />
              </label>
              <label className="form-control">
                <span className="label-text">{t("common.phone")}</span>
                <input className="input input-bordered" name="telefono" value={form.telefono} onChange={onChange} />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text">{t("contacts.fields.title")}</span>
                <input className="input input-bordered" name="cargo" value={form.cargo} onChange={onChange} />
              </label>
              <label className="form-control">
                <span className="label-text">{t("contacts.fields.role")}</span>
                <input className="input input-bordered" name="rol" value={form.rol} onChange={onChange} placeholder="Decision maker / Estimator / AP ..." />
              </label>
            </div>

            <label className="form-control">
              <span className="label-text">{t("contacts.fields.notes")}</span>
              <textarea className="textarea textarea-bordered h-20" name="notas" value={form.notas} onChange={onChange} />
            </label>

            <label className="label cursor-pointer justify-start gap-2">
              <input type="checkbox" className="toggle toggle-sm" name="es_principal" checked={form.es_principal} onChange={onChange} />
              <span className="label-text">{t("contacts.primary")}</span>
            </label>

            <div className="pt-1 flex justify-end">
              <button type="submit" className={`btn btn-primary ${saving ? "btn-disabled" : ""}`}>
                <Save size={16} className="mr-1" /> {editing ? t("actions.update") : t("actions.add")}
              </button>
            </div>
          </form>

          {/* Lista */}
          <section className="lg:col-span-2 flex flex-col">
            <div className="mb-3 flex gap-2 items-center">
              <div className="input input-bordered input-sm flex-1">
                <input
                  className="w-full bg-transparent outline-none"
                  placeholder={t("contacts.searchPlaceholder")}
                  value={q}
                  onChange={(e)=>setQ(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>{t("contacts.fields.name")}</th>
                    <th>Email</th>
                    <th>{t("common.phone")}</th>
                    <th className="hidden lg:table-cell">{t("contacts.fields.role")}</th>
                    <th className="hidden lg:table-cell">{t("contacts.fields.notes")}</th>
                    <th className="text-right">{t("actions.update")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6}><div className="skeleton h-6 w-full" /></td></tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center opacity-70 py-6">{t("contacts.empty")}</td></tr>
                  ) : (
                    filtered.map(c => (
                      <Row
                        key={c.id}
                        c={c}
                        onEdit={startEdit}
                        onDelete={del}
                        onMakePrimary={makePrimary}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
