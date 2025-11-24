// src/hooks/useUsersOptions.js
import { useEffect, useState } from "react";
import { getUsuarios } from "../api/users";

/**
 * Devuelve { options, loading, error }
 * options: [{ value: email, label: "Nombre o email" }]
 */
export function useUsersOptions(org = 10) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getUsuarios(org);
        const list = Array.isArray(data?.usuarios) ? data.usuarios : (Array.isArray(data) ? data : []);
        const opts = list.map(u => {
          const email = u.email || u.usuario_email || "";
          const name  = u.nombre || u.name || "";
          return email ? { value: email, label: name ? `${name} (${email})` : email } : null;
        }).filter(Boolean);
        if (alive) setOptions(opts);
      } catch (e) {
        if (alive) setError(e?.message || "users_fetch_error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [org]);

  return { options, loading, error };
}
