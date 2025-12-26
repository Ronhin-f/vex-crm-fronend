// src/hooks/useUsersOptions.js
import { useEffect, useMemo, useState } from "react";
import { getUsuarios } from "../api/users";
import { useAuth } from "../context/AuthContext";

/**
 * Devuelve { options, loading, error }
 * options: [{ value: email, label: "Nombre o email" }]
 */
export function useUsersOptions(org) {
  const { orgId: authOrgId } = useAuth();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resolvedOrg = useMemo(() => {
    const direct = org != null && String(org).trim() ? org : null;
    if (direct) return direct;
    if (authOrgId != null && String(authOrgId).trim()) return authOrgId;
    try {
      return localStorage.getItem("organizacion_id") || localStorage.getItem("vex_org_id") || null;
    } catch {
      return null;
    }
  }, [org, authOrgId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (alive) {
        setLoading(true);
        setError(null);
      }
      if (!resolvedOrg) {
        if (alive) {
          setOptions([]);
          setLoading(false);
        }
        return;
      }
      try {
        const data = await getUsuarios(resolvedOrg);
        const list = Array.isArray(data?.usuarios) ? data.usuarios : Array.isArray(data) ? data : [];
        const opts = list
          .map((u) => {
            const email = u.email || u.usuario_email || "";
            const name = u.nombre || u.name || u.full_name || "";
            return email ? { value: email, label: name ? `${name} (${email})` : email } : null;
          })
          .filter(Boolean);
        if (alive) setOptions(opts);
      } catch (e) {
        if (alive) setError(e?.message || "users_fetch_error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [resolvedOrg]);

  return { options, loading, error };
}
