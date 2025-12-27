// src/routes/AreaConfig.jsx
import { useMemo } from "react";
import { useArea } from "../context/AreaContext";
import { Sliders, RefreshCcw, ExternalLink } from "lucide-react";

const CORE_ADMIN_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CORE_APP_URL) ||
  "https://vex-core-frontend.vercel.app/#/admin";

export default function AreaConfig() {
  const { area, features, availableAreas, refresh } = useArea();

  const selected = useMemo(
    () => ({
      area: area || "general",
      clinicalHistory: !!features?.clinicalHistory,
    }),
    [area, features?.clinicalHistory]
  );

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

      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control">
              <span className="label-text">Area</span>
              <select
                className="select select-bordered"
                value={selected.area}
                disabled
              >
                {(availableAreas || ["general", "salud", "veterinaria"]).map((a) => (
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
                  checked={selected.clinicalHistory}
                  readOnly
                  disabled
                />
                <span className="text-sm text-base-content/70">Habilitar registro de historias clinicas</span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => refresh()}>
              <RefreshCcw className="w-4 h-4" /> Refrescar
            </button>
            <a href={CORE_ADMIN_URL} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
              Editar en Core <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="alert alert-info">
        <div>
          <p className="font-semibold">Nota</p>
          <p className="text-sm">
            Lectura desde Core. Para cambiar el area/vertical o habilitar historias clinicas, editá el perfil de la
            organizacion en Vex Core.
          </p>
        </div>
      </div>
    </div>
  );
}
