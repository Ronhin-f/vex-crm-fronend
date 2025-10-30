import { useEffect, useState } from "react";
import { getUsuarios } from "../api/users";

export function useUsersOptions(orgId = 10) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getUsuarios(orgId)
      .then((rows) => {
        if (!mounted) return;
        const opts = (rows || []).map((u) => ({ value: u.email, label: u.email }));
        setOptions(opts);
      })
      .catch((e) => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [orgId]);

  return { options, loading, error };
}
