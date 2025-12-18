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
  features: { clinicalHistory: false, labResults: false },
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
    const fallbackArea = BASE_PROFILE.area;
    try {
      // Preferimos Core, pero con hint local como respaldo
      const { data } = await coreApi.get("/perfil/organizacion", {
        params: { organizacion_id: orgId },
      });
      const p = data?.perfil || {};
      const areaFromCore = normalizeArea(p.area_vertical) || areaHint || fallbackArea;
      const areaVocab =
        areaFromCore === "veterinaria"
          ? { clients: "Dueños", client: "Dueño", contacts: "Mascotas", contact: "Mascota" }
          : {};
      const merged = {
        area: areaFromCore,
        vocab: { ...BASE_PROFILE.vocab, ...(data?.vocab || {}), ...areaVocab },
        features: {
          ...BASE_PROFILE.features,
          clinicalHistory: !!p.habilita_historias_clinicas,
          labResults:
            typeof p.habilita_resultados_lab === "boolean"
              ? p.habilita_resultados_lab
              : areaFromCore === "veterinaria",
        },
        forms: BASE_PROFILE.forms,
        availableAreas: BASE_PROFILE.availableAreas,
      };

      if (merged.area) {
        try {
          localStorage.setItem("vex_area_vertical", merged.area);
        } catch {}
      }

      // Leemos perfil desde CRM antes de sincronizar para no pisar configuraciones previas
      let nextProfile = merged;
      try {
        const { data: crmProfile } = await crmApi.get("/area/perfil", {
          params: { organizacion_id: orgId },
        });
        if (crmProfile?.area) {
          nextProfile = {
            area: crmProfile.area,
            vocab: { ...merged.vocab, ...(crmProfile.vocab || {}) },
            features: { ...merged.features, ...(crmProfile.features || {}) },
            forms: crmProfile.forms || merged.forms,
            availableAreas: crmProfile.availableAreas || merged.availableAreas,
          };
        }
      } catch {
        // best-effort; seguimos con merged
      }

      try {
        const { data: sync } = await crmApi.post("/area/sync", {
          area: nextProfile.area,
          features: {
            clinicalHistory: !!nextProfile.features?.clinicalHistory,
            labResults: !!nextProfile.features?.labResults,
          },
          vocab: nextProfile.vocab,
          forms: nextProfile.forms,
        });
        const perfil = sync?.perfil;
        if (perfil) {
          nextProfile = {
            area: perfil.area || nextProfile.area,
            vocab: { ...nextProfile.vocab, ...(perfil.vocab || {}) },
            features: { ...nextProfile.features, ...(perfil.features || {}) },
            forms: perfil.forms || nextProfile.forms,
            availableAreas: perfil.availableAreas || nextProfile.availableAreas,
          };
        }
      } catch {
        // best-effort; seguimos con nextProfile
      }

      setProfile(nextProfile);

      return nextProfile;
    } catch {
      // Si Core falla, usamos areaHint como fallback suave; caso contrario, general.
      const safeArea = areaHint || fallbackArea;
      setProfile((prev) => ({
        ...prev,
        area: safeArea,
        availableAreas: BASE_PROFILE.availableAreas,
      }));
      return { ...BASE_PROFILE, area: safeArea };
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
