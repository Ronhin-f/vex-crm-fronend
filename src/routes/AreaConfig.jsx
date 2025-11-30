// src/routes/AreaConfig.jsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../utils/api";
import { useArea } from "../context/AreaContext";
import { Sliders, RefreshCcw } from "lucide-react";

export default function AreaConfig() {
  const { area, features, availableAreas, refresh } = useArea();
  const [form, setForm] = useState({ area, clinicalHistory: features?.clinicalHistory || false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ area, clinicalHistory: features?.clinicalHistory || false });
  }, [area, features?.clinicalHistory]);

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    const t = toast.loading("Guardando...");
    try {
      await api.put("/area/perfil", {
        area: form.area,
        features: { clinicalHistory: form.clinicalHistory },
      });
      toast.success("Perfil guardado");
      refresh();
    } catch {
      toast.error("No se pudo guardar el perfil");
    } finally {
      toast.dismiss(t);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Area / Vertical</h1>
          <p className="text-sm text-base-content/70">Elegí el tipo de negocio para ajustar vocabulario y features.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control">
              <span className="label-text">Area</span>
              <select
                className="select select-bordered"
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              >
                {(availableAreas || ["general", "salud", "construccion", "veterinaria"]).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text">Historias clinicas</span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="toggle"
                  checked={form.clinicalHistory}
                  onChange={(e) => setForm((f) => ({ ...f, clinicalHistory: e.target.checked }))}
                />
                <span className="text-sm text-base-content/70">Habilitar registro de historias clinicas</span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => refresh()}>
              <RefreshCcw className="w-4 h-4" /> Refrescar
            </button>
            <button type="submit" className={`btn btn-primary ${saving ? "btn-disabled" : ""}`}>
              Guardar
            </button>
          </div>
        </div>
      </form>

      <div className="alert alert-info">
        <div>
          <p className="font-semibold">Nota</p>
          <p className="text-sm">Los cambios aplican a toda la organizacion. El frontend ya toma el perfil para labels y para habilitar historias clinicas.</p>
        </div>
      </div>
    </div>
  );
}
