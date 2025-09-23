// src/routes/Clientes.jsx — Clientes “puros”
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import { Plus, X } from "lucide-react";

function SlideOver({ open, onClose, title, children, widthClass = "w-full sm:w-[480px] md:w-[560px]" }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none select-none"}`}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full bg-base-100 shadow-xl border-l border-base-200 ${widthClass}
                      transition-transform ${open ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></button>
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
  const [q, setQ] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: "", contacto_nombre: "", email: "", telefono: "", direccion: "", observacion: ""
  });

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/clientes");
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t("clients.toasts.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const reset = () => setForm({ nombre: "", contacto_nombre: "", email: "", telefono: "", direccion: "", observacion: "" });

  function openCreate() { setEditing(null); reset(); setOpenForm(true); }
  function openEdit(cli) {
    setEditing(cli);
    setForm({
      nombre: cli.nombre || "", contacto_nombre: cli.contacto_nombre || "",
      email: cli.email || "", telefono: cli.telefono || "",
      direccion: cli.direccion || "", observacion: cli.observacion || ""
    });
    setOpenForm(true);
  }

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!form.nombre.trim()) return toast.error(t("clients.form.name"));
    const un = toast.loading(t("actions.sending"));
    try {
      let resp;
      if (editing?.id) {
        resp = await api.patch(`/clientes/${editing.id}`, form);
        setItems(prev => prev.map(c => (c.id === editing.id ? { ...c, ...resp.data } : c)));
        toast.success(t("clients.toasts.updated"));
      } else {
        resp = await api.post("/clientes", form);
        setItems(prev => [resp.data, ...prev]);
        toast.success(t("clients.toasts.created"));
      }
      setOpenForm(false); setEditing(null); reset();
    } catch {
      toast.error(editing?.id ? t("clients.toasts.updateError") : t("clients.toasts.cannotCreate"));
    } finally { toast.dismiss(un); }
  }

  async function remove(id) {
    if (!confirm(t("actions.confirmDelete", "¿Eliminar cliente?"))) return;
    try {
      await api.delete(`/clientes/${id}`);
      setItems(prev => prev.filter(x => x.id !== id));
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
      arr = arr.filter(c =>
        [c.nombre, c.contacto_nombre, c.email, c.telefono, c.direccion]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(term))
      );
    }
    arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return arr;
  }, [items, q]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("clients.title", "Clientes")}</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> {t("actions.add")}</button>
      </div>

      <input className="input input-bordered input-sm w-full max-w-md" placeholder={t("common.search", "Buscar...")}
        value={q} onChange={(e) => setQ(e.target.value)} />

      <section className="card bg-base-100 shadow">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>{t("clients.form.name")}</th>
                  <th className="hidden md:table-cell">{t("clients.form.contactName", "Contacto")}</th>
                  <th>Email</th>
                  <th>{t("common.phone")}</th>
                  <th className="hidden lg:table-cell">{t("clients.form.address", "Dirección")}</th>
                  <th className="text-right pr-4">{t("actions.update")}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={6}><div className="skeleton h-6 w-full" /></td></tr>
                )) : list.length === 0 ? (
                  <tr><td colSpan={6} className="text-center opacity-70 py-6">{t("clients.list.none")}</td></tr>
                ) : list.map(c => (
                  <tr key={c.id} className="hover">
                    <td onClick={() => openEdit(c)} className="cursor-pointer">
                      <div className="font-medium">{c.nombre}</div>
                      <div className="text-xs opacity-70">{c.observacion || "—"}</div>
                    </td>
                    <td className="hidden md:table-cell">{c.contacto_nombre || "—"}</td>
                    <td>{c.email || "—"}</td>
                    <td>{c.telefono || "—"}</td>
                    <td className="hidden lg:table-cell">{c.direccion || "—"}</td>
                    <td className="text-right pr-4">
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-ghost btn-xs" onClick={() => openEdit(c)}>{t("actions.update")}</button>
                        <button className="btn btn-ghost btn-xs text-error" onClick={() => remove(c.id)}>{t("actions.delete","Eliminar")}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <SlideOver
        open={openForm}
        onClose={() => { setOpenForm(false); setEditing(null); }}
        title={editing ? t("actions.update") : t("actions.add")}
      >
        <form onSubmit={onSubmit} className="space-y-3">
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
            <label className="label">{t("clients.form.notes","Observación")}</label>
            <textarea className="textarea textarea-bordered w-full" name="observacion" value={form.observacion} onChange={onChange} />
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <button type="button" className="btn btn-ghost" onClick={() => { setOpenForm(false); setEditing(null); }}>
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
