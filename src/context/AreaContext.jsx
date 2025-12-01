// src/context/AreaContext.jsx — vocabulario/config por area
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { coreApi, crmApi } from "../utils/api";
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

const ALLOWED_AREAS = BASE_PROFILE.availableAreas;
const AreaContext = createContext(BASE_PROFILE);

const normalizeArea = (a) => {
  if (!a) return null;
  const v = String(a).trim().toLowerCase();
  return ALLOWED_AREAS.includes(v) ? v : null;
};

export function AreaProvider({ children }) {
  const { isAuthed, orgId, usuario } = useAuth();
  const [profile, setProfile] = useState(BASE_PROFILE);
  const [loading, setLoading] = useState(false);

  const areaHint = useMemo(() => {
    const fromUser = normalizeArea(usuario?.area_vertical || usuario?.area);
    if (fromUser) return fromUser;
    try {
      const stored = localStorage.getItem("vex_area_vertical");
      return normalizeArea(stored);
    } catch {
      return null;
    }
  }, [usuario?.area_vertical, usuario?.area]);

  const load = async () => {
    if (!isAuthed || !orgId) {
      setProfile(BASE_PROFILE);
      return BASE_PROFILE;
    }
    setLoading(true);
    const fallbackArea = areaHint || BASE_PROFILE.area;
    try {
      const { data } = await coreApi.get("/perfil/organizacion", {
        headers: { "X-Org-Id": orgId },
      });
      const p = data?.perfil || {};
      const merged = {
        area: normalizeArea(p.area_vertical) || fallbackArea,
        vocab: { ...BASE_PROFILE.vocab, ...(data?.vocab || {}) },
        features: {
          ...BASE_PROFILE.features,
          clinicalHistory: !!p.habilita_historias_clinicas,
        },
        forms: BASE_PROFILE.forms,
        availableAreas: BASE_PROFILE.availableAreas,
      };
      setProfile(merged);

      if (merged.area) {
        try {
          localStorage.setItem("vex_area_vertical", merged.area);
        } catch {}
      }

      crmApi
        .post("/area/sync", {
          area: merged.area,
          features: { clinicalHistory: !!p.habilita_historias_clinicas },
        })
        .catch(() => {});

      return merged;
    } catch {
      setProfile((prev) => ({
        ...prev,
        area: fallbackArea,
        availableAreas: BASE_PROFILE.availableAreas,
      }));
      return { ...BASE_PROFILE, area: fallbackArea };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isAuthed, orgId, areaHint]);

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
