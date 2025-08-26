import { useEffect, useState } from "react";
import { Users, ClipboardList, BellRing, Clock, User2 } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function DashboardCRM() {
  const { usuario } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total_clientes: 0,
    total_tareas: 0,
    proximos_7d: 0,
  });
  const [top, setTop] = useState([]);
  const [seg, setSeg] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/dashboard");
        if (!mounted) return;
        setMetrics(
          data?.metrics ?? { total_clientes: 0, total_tareas: 0, proximos_7d: 0 }
        );
        setTop(Array.isArray(data?.topClientes) ? data.topClientes : []);
        setSeg(Array.isArray(data?.proximosSeguimientos) ? data.proximosSeguimientos : []);
      } catch (e) {
        console.error("Dashboard error", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="skeleton h-9 w-56 mb-4" />
        <div className="skeleton h-24 w-full mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Vex CRM — Dashboard</h1>
        <p className="text-sm text-base-content/70 mb-6">
          Hola, <b>{usuario?.email}</b>
        </p>

        {/* Stats */}
        <div className="stats shadow bg-base-100 mb-8 w-full">
          <div className="stat">
            <div className="stat-figure text-primary"><Users size={20} /></div>
            <div className="stat-title">Clientes</div>
            <div className="stat-value">{metrics.total_clientes}</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary"><ClipboardList size={20} /></div>
            <div className="stat-title">Tareas</div>
            <div className="stat-value">{metrics.total_tareas}</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-accent"><BellRing size={20} /></div>
            <div className="stat-title">Seguimientos (7 días)</div>
            <div className="stat-value">{metrics.proximos_7d}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top clientes */}
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">
                🆕 Top clientes recientes
              </h2>
              {top.length === 0 ? (
                <p className="text-sm text-base-content/60">No hay clientes recientes.</p>
              ) : (
                <ul className="menu bg-base-100 rounded-box w-full">
                  {top.map((c) => (
                    <li key={c.id} className="py-1">
                      <div className="flex items-center gap-3">
                        <User2 className="text-primary" size={16} />
                        <div className="flex-1">
                          <div className="font-medium leading-5">{c.nombre}</div>
                          <div className="text-xs text-base-content/60">
                            {c.email || "—"} • {c.telefono || "—"}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Próximos 7 días */}
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">⏰ Próximos 7 días</h2>
              {seg.length === 0 ? (
                <p className="text-sm text-base-content/60">Sin seguimientos próximos.</p>
              ) : (
                <ul className="divide-y divide-base-200">
                  {seg.map((s) => {
                    const due = new Date(s.vence_en);
                    const mins = (due - Date.now()) / 60000;
                    const tone =
                      mins < 0 ? "badge-error" :
                      mins <= 60 * 24 ? "badge-warning" : "badge-info";
                    return (
                      <li key={s.id} className="py-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{s.titulo}</div>
                          <div className="text-xs text-base-content/60">
                            {s.cliente_nombre || "—"}
                          </div>
                        </div>
                        <span className={`badge ${tone} badge-outline flex items-center gap-1`}>
                          <Clock size={14} />
                          {due.toLocaleString()}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
