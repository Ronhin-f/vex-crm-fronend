// src/hooks/useAuthFromLocalStorage.js
// Fuente única de verdad para auth (token + usuario) leyendo localStorage.
// - Sincroniza entre pestañas (login-event / logout-event)
// - Refresca el usuario desde Core (/usuarios/me) cuando hay token
// - Redirige a Core Login si el token es inválido (con ?next=<url>)
import { useEffect, useState, useCallback } from "react";
import { coreApi } from "../utils/api";

const TOKEN_KEY = "vex_token";
const USER_KEY = "user";
const ALLOWED_AREAS = ["general", "salud", "veterinaria"];

const normalizeArea = (a) => {
  if (!a) return null;
  const v = String(a).trim().toLowerCase();
  return ALLOWED_AREAS.includes(v) ? v : null;
};

function normalizeUser(raw) {
  if (!raw || typeof raw !== "object") return null;
  const org =
    raw.organizacion_id ??
    raw.organization_id ??
    raw.org_id ??
    null;
  if (!org) return null;

  const cleanOrg = String(org);
  const email = typeof raw.email === "string" ? raw.email.trim() : null;
  const rol = typeof raw.rol === "string" ? raw.rol : raw.role;
  const area = normalizeArea(raw.area_vertical || raw.area);

  const safe = {
    organizacion_id: cleanOrg,
    organization_id: cleanOrg,
  };
  if (email) safe.email = email;
  if (rol) safe.rol = rol;
  if (area) safe.area_vertical = area;
  return safe;
}

function getCoreLoginUrl(nextUrl) {
  const base =
    (import.meta.env.VITE_CORE_LOGIN_URL ||
      "https://vex-core-frontend.vercel.app").replace(/\/+$/, "");
  const next = encodeURIComponent(nextUrl || (typeof window !== "undefined" ? window.location.href : "/"));
  return `${base}/?next=${next}`;
}

export function useAuth() {
  // Estado reactivo del token (no constante)
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? normalizeUser(JSON.parse(raw)) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // ---- helpers de almacenamiento ----
  const writeUser = useCallback((u) => {
    const normalized = normalizeUser(u);
    try {
      if (normalized) {
        localStorage.setItem(USER_KEY, JSON.stringify(normalized));
        if (normalized.area_vertical) {
          localStorage.setItem("vex_area_vertical", normalized.area_vertical);
        } else {
          localStorage.removeItem("vex_area_vertical");
        }
      } else {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("vex_area_vertical");
      }
    } catch {}
    setUsuario(normalized || null);
  }, []);

  const writeToken = useCallback((t) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken(t || null);
  }, []);

  // ---- cargar / refrescar usuario desde Core ----
  const fetchMe = useCallback(async () => {
    if (!token) return null;
    const { data } = await coreApi.get("/usuarios/me", {
      headers: { Authorization: `Bearer ${token}` }, // redundante pero explícito
    });
    const u = data?.usuario;
    if (!u?.email || !(u?.organizacion_id || u?.organization_id)) {
      throw new Error("Usuario inválido");
    }
    writeUser(u);
    return u;
  }, [token, writeUser]);

  // ---- efectos ----
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        if (token && !usuario) {
          await fetchMe();
        }
      } catch (e) {
        // token inválido / expirado / error duro → limpiar y mandar a Core
        writeToken(null);
        writeUser(null);
        if (active && typeof window !== "undefined") {
          window.location.href = getCoreLoginUrl();
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token, usuario, fetchMe, writeToken, writeUser]);

  // Sync entre pestañas
  useEffect(() => {
    const onStorage = (ev) => {
      // Logout global
      if (ev.key === "logout-event") {
        writeToken(null);
        writeUser(null);
        return;
      }
      // Login global
      if (ev.key === "login-event") {
        const t = localStorage.getItem(TOKEN_KEY);
        writeToken(t);
        // Intentamos refrescar el usuario en esta pestaña
        if (t) fetchMe().catch(() => {});
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchMe, writeToken, writeUser]);

  // ---- acciones públicas ----
  const login = useCallback((newToken, maybeUser) => {
    writeToken(newToken || null);
    if (maybeUser) writeUser(maybeUser);
    try { localStorage.setItem("login-event", String(Date.now())); } catch {}
    if (!maybeUser && newToken) {
      // si no vino el usuario, lo traemos
      fetchMe().catch(() => {});
    }
  }, [fetchMe, writeToken, writeUser]);

  const refresh = useCallback(() => {
    if (token) return fetchMe();
    return Promise.resolve(null);
  }, [token, fetchMe]);

  // Actualiza parcialmente el usuario en memoria + localStorage (ej. nombre/avatar desde perfil)
  const mergeUser = useCallback((updates) => {
    if (!updates) return;
    setUsuario((prev) => {
      const next = normalizeUser({ ...(prev || {}), ...(updates || {}) });
      try {
        if (next) {
          localStorage.setItem(USER_KEY, JSON.stringify(next));
          if (next.area_vertical) {
            localStorage.setItem("vex_area_vertical", next.area_vertical);
          }
        } else {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem("vex_area_vertical");
        }
        localStorage.setItem("login-event", String(Date.now()));
      } catch {}
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    writeToken(null);
    writeUser(null);
    try { localStorage.setItem("logout-event", String(Date.now())); } catch {}
    if (typeof window !== "undefined") {
      window.location.href = getCoreLoginUrl(window.location.origin);
    }
  }, [writeToken, writeUser]);

  return {
    usuario,
    token,
    rol: usuario?.rol || null,
    organization_id: usuario?.organization_id || usuario?.organizacion_id || null,
    loading,
    // acciones
    login,
    logout,
    refresh,
    mergeUser,
  };
}

export default useAuth;
