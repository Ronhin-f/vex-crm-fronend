// src/context/AreaContext.jsx — vocabulario/config por area
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { coreApi } from "../utils/api";
import { useAuth } from "./AuthContext";

const BASE_PROFILE = {
  area: "general",
  vocab: {
    clients: "Clientes",
    client: "Cliente",
    contacts: "Contactos",
    contact: "Contacto",
    projects: "Proyectos",
    providers: "Subcontratistas",
    tasks: "Tareas",
    billing: "Facturacion",
    clinicalHistory: "Historia clinica",
    clinicalHistoryList: "Historias clinicas",
  },
  features: { clinicalHistory: false },
  forms: {
    clinicalHistory: {
      fields: [
        { name: "motivo", label: "Motivo de consulta", type: "text" },
        { name: "diagnostico", label: "Diagnostico", type: "textarea" },
        { name: "tratamiento", label: "Plan / Tratamiento", type: "textarea" },
        { name: "indicaciones", label: "Indicaciones", type: "textarea" },
        { name: "notas", label: "Notas internas", type: "textarea" },
      ],
      vitalSigns: [],
    },
  },
  availableAreas: ["general", "salud", "construccion", "veterinaria"],
};

const AreaContext = createContext(BASE_PROFILE);

function deepMerge(base, extra) {
  if (!extra || typeof extra !== "object") return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(extra)) {
    if (v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object") {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function AreaProvider({ children }) {
  const { isAuthed, orgId } = useAuth();
  const [profile, setProfile] = useState(BASE_PROFILE);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!isAuthed) {
      setProfile(BASE_PROFILE);
      return;
    }
    setLoading(true);
    try {
      const { data } = await coreApi.get("/perfil/organizacion");
      const p = data?.perfil || {};
      const merged = {
        area: p.area_vertical || BASE_PROFILE.area,
        vocab: { ...BASE_PROFILE.vocab, ...(data?.vocab || {}) },
        features: {
          ...BASE_PROFILE.features,
          clinicalHistory: !!p.habilita_historias_clinicas,
        },
        forms: BASE_PROFILE.forms,
        availableAreas: BASE_PROFILE.availableAreas,
      };
      setProfile(merged);
    } catch {
      setProfile(BASE_PROFILE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isAuthed, orgId]);

  const value = useMemo(
    () => ({
      ...profile,
      loading,
      refresh: load,
    }),
    [profile, loading]
  );

  return <AreaContext.Provider value={value}>{children}</AreaContext.Provider>;
}

export function useArea() {
  return useContext(AreaContext);
}

export default AreaContext;
