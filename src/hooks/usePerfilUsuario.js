// src/hooks/usePerfilUsuario.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { coreApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";

let cache = { key: null, data: null };

export function usePerfilUsuario(emailProp) {
  const { usuario, mergeUser } = useAuth();
  const email = emailProp || usuario?.email || null;
  const orgId = usuario?.organization_id || usuario?.organizacion_id || null;
  const cacheKey = email && orgId ? `${orgId}:${email}` : null;

  const cacheHit = useMemo(
    () => (cacheKey && cache.key === cacheKey ? cache.data : null),
    [cacheKey]
  );

  const [perfil, setPerfil] = useState(cacheHit);
  const [loading, setLoading] = useState(!cacheHit && !!email);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!email) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await coreApi.get(`/perfil/usuarios/${encodeURIComponent(email)}`);
      const p = res?.data?.perfil || null;
      setPerfil(p);
      if (cacheKey) cache = { key: cacheKey, data: p };

      if (p?.nombre || p?.apellido) {
        mergeUser?.({
          nombre: p.nombre || undefined,
          apellido: p.apellido || undefined,
          nombre_completo: p.nombre_completo || undefined,
          avatar_url: p.avatar_url || undefined,
        });
      }
      return p;
    } catch (e) {
      const msg = e?.response?.data?.error || "No se pudo cargar tu perfil";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [email, cacheKey, mergeUser]);

  useEffect(() => {
    if (!email) return;
    if (cacheKey && cache.key === cacheKey && cache.data) return;
    refresh();
  }, [email, cacheKey, refresh]);

  return { perfil, loading, error, refresh, setPerfil };
}

export default usePerfilUsuario;
