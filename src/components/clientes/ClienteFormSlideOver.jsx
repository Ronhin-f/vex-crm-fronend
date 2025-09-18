import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import api from "../../api";

/**
 * Form de Cliente dentro del SlideOver.
 * Props:
 * - open, onClose
 * - initial (para edición opcional)
 * - onSaved(cliente)
 */
export default function ClienteFormSlideOver({ open, onClose, initial = null, onSaved }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    source: "",
    assignee: "",
    due_at: "",
    estimate_url: "",
    stage: "Incoming Leads",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        nombre: initial.nombre || "",
        empresa: initial.empresa || "",
        email: initial.email || "",
        telefono: initial.telefono || "",
        source: initial.source || "",
        assignee: initial.assignee || "",
        due_at: initial.due_at ? new Date(initial.due_at).toISOString().slice(0,16) : "",
        estimate_url: initial.estimate_url || "",
        stage: initial.stage || "Incoming Leads",
      });
    } else {
      setForm((f)=>({ ...f, nombre:"", empresa:"", email:"", telefono:"", source:"", assignee:"", due_at:"", estimate_url:"", stage:"Incoming Leads" }));
    }
  }, [initial, open]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const un = toast.loading(t("actions.sending", "Enviando..."));
    try {
      const payload = {
        ...form,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      };
      let resp;
      if (initial?.id) {
        resp = await api.patch(`/clientes/${initial.id}`, payload);
      } else {
        resp = await api.post("/clientes", payload);
      }
      toast.dismiss(un);
      toast.success(initial ? t("clients.toasts.updated") : t("clients.toasts.created"));
      onSaved?.(resp.data);
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.dismiss(un);
      toast.error(initial ? t("clients.toasts.updateError") : t("clients.toasts.cannotCreate"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t("clients.form.name")}</span>
        </label>
        <input name="nombre" required className="input input-bordered" value={form.nombre} onChange={onChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="form-control">
          <label className="label"><span className="label-text">{t("common.source")}</span></label>
          <input name="source" className="input input-bordered" value={form.source} onChange={onChange} placeholder="Outreach / Gmail / BC / Blue Book…" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">{t("clients.form.stage")}</span></label>
          <select name="stage" className="select select-bordered" value={form.stage} onChange={onChange}>
            {Object.keys({
              "Incoming Leads":1, "Unqualified":1, "Qualified":1,
              "Follow-up Missed":1, "Bid/Estimate Sent":1, "Won":1, "Lost":1
            }).map(k => <option key={k} value={k}>{t(`common.stages.${k}`)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="form-control">
          <label className="label"><span className="label-text">{t("clients.form.assignee")}</span></label>
          <input name="assignee" className="input input-bordered" value={form.assignee} onChange={onChange} placeholder="austin@sanjuantuff.com" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">{t("clients.form.dueDate")}</span></label>
          <input type="datetime-local" name="due_at" className="input input-bordered" value={form.due_at} onChange={onChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="form-control">
          <label className="label"><span className="label-text">{t("clients.form.email")}</span></label>
          <input name="email" className="input input-bordered" value={form.email} onChange={onChange} />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">{t("clients.form.phone")}</span></label>
          <input name="telefono" className="input input-bordered" value={form.telefono} onChange={onChange} />
        </div>
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">{t("clients.form.estimateUrl")}</span></label>
        <input name="estimate_url" className="input input-bordered" value={form.estimate_url} onChange={onChange} />
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">{t("clients.form.contactInfo")}</span></label>
        <input name="empresa" className="input input-bordered" value={form.empresa} onChange={onChange} placeholder={t("clients.form.contactInfo")} />
      </div>

      <div className="pt-2 flex gap-2 justify-end">
        <button type="button" className="btn btn-ghost" onClick={onClose}>{t("actions.cancel")}</button>
        <button type="submit" className={`btn btn-primary ${saving ? "btn-disabled" : ""}`}>
          {initial ? t("actions.update") : t("actions.add")}
        </button>
      </div>
    </form>
  );
}
