// src/context/AuthContext.jsx
import { createContext, useContext, useMemo } from "react";
import { useAuth as useAuthFromLocalStorage } from "../hooks/useAuthFromLocalStorage";

/**
 * Contexto de autenticación para Vex CRM.
 * - Fuente única: hook useAuthFromLocalStorage (lee/escucha localStorage y window events).
 * - Expone campos mínimos + derivados: isAuthed, email, orgId.
 * - Mantiene referencias estables para evitar renders extra.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuthFromLocalStorage();

  const value = useMemo(() => {
    const usuario = auth?.usuario ?? null;
    const token = auth?.token ?? null;
    const rol =
      auth?.rol ??
      usuario?.rol ??
      null;

    const orgId =
      usuario?.organization_id ??
      usuario?.organizacion_id ??
      (typeof window !== "undefined" ? localStorage.getItem("organizacion_id") : null);

    const email = usuario?.email ?? null;

    return {
      // base
      token,
      usuario,
      rol,
      loading: !!auth?.loading,

      // helpers derivados
      isAuthed: Boolean(token),
      email,
      orgId,

      // acciones (mantener nombres existentes)
      login: auth?.login,
      logout: auth?.logout,
      refresh: auth?.refresh,
    };
  // Importante: incluimos funciones por si cambian de identidad en el hook
  }, [auth?.usuario, auth?.token, auth?.rol, auth?.loading, auth?.login, auth?.logout, auth?.refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook de consumo. Si por algún motivo falta el Provider (dev/SSR),
 * hacemos fallback al hook raw para no romper la app.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? useAuthFromLocalStorage();
}

export default AuthContext;
