// src/routes/DashboardCRM.jsx
import { useEffect, useState } from "react";
import {
  Users,
  ClipboardList,
  BellRing,
  User2,
  Trophy,
  ThumbsDown,
  Percent,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function DashboardCRM() {
  const { usuario } = useAuth();
  const { t, i18n } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    total_clientes: 0,
    total_tareas: 0,
    proximos_7d: 0,
  });

  const [kpis, setKpis] = useState({
    won: 0,
    lost: 0,
    winRate: 0,
    proximos7d: 0,
  });

  const [top, setTop] = useState([]);
  const [seg, setSeg] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [dashRes, kpiRes] = await Promise.all([
          api.get("/dashboard"),
          api.get("/kanban/kpis"),
        ]);

        if (!mounted) return;

        // Dashboard base
        const dash = dashRes?.data ?? {};
        setMetrics(
          dash.metrics ?? { total_clientes: 0, total_tareas: 0, proximos_7d: 0 }
        );
        setTop(Array.isArray(dash.topClientes) ? dash.topClientes : []);
        setSeg(
          Array.isArray(dash.proximosSeguimientos)
            ? dash.proximosSeguimientos
            : []
        );

        // KPIs de pipeline
        const k = kpiRes?.data ?? {};
        const won =
          k.clientesPorCat?.find((x) => x.categoria === "Won")?.total ?? 0;
        const lost =
          k.clientesPorCat?.find((x) => x.categoria === "Lost")?.total ?? 0;
        const total = won + lost;
        const winRate = total ? Math.round((won / total) * 100) : 0;

        setKpis({
          won,
          lost,
          winRate,
          proximos7d: k.proximos7d ?? 0,
        });
      } catch (e) {
        console.error("Dashboard error", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1">{t("dashboard.title")}</h1>
            <p className="text-sm text-base-content/70 mb-4">
              {t("dashboard.hello", { email: usuario?.email || "" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/pipeline" className="btn btn-primary btn-sm">
              Pipeline
            </Link>
            <Link to="/kanban-tareas" className="btn btn-ghost btn-sm">
              Kanban Tareas
            </Link>
          </div>
        </div>

        {/* KPIs de Pipeline */}
        <div className="stats shadow bg-base-100 mb-4 w-full">
          <div className="stat">
            <div className="stat-figure text-success">
              <Trophy size={20} />
            </div>
            <div className="stat-title">Won</div>
            <div className="stat-value">{kpis.won}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-error">
              <ThumbsDown size={20} />
            </div>
            <div className="stat-title">Lost</div>
            <div className="stat-value">{kpis.lost}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-info">
              <Percent size={20} />
            </div>
            <div className="stat-title">Win rate</div>
            <div className="stat-value">{kpis.winRate}%</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-accent">
              <BellRing size={20} />
            </div>
            <div className="stat-title">{t("metrics.followups7d")}</div>
            <div className="stat-value">{kpis.proximos7d}</div>
          </div>
        </div>

        {/* Métricas base */}
        <div className="stats shadow bg-base-100 mb-8 w-full">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Users size={20} />
            </div>
            <div className="stat-title">{t("metrics.clients")}</div>
            <div className="stat-value">{metrics.total_clientes}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-secondary">
              <ClipboardList size={20} />
            </div>
            <div className="stat-title">{t("metrics.tasks")}</div>
            <div className="stat-value">{metrics.total_tareas}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-accent">
              <BellRing size={20} />
            </div>
            <div className="stat-title">{t("metrics.followups7d")}</div>
            <div className="stat-value">{metrics.proximos_7d}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top clientes recientes */}
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">🆕 {t("cards.topRecentClients")}</h2>
              {top.length === 0 ? (
                <p className="text-sm text-base-content/60">
                  {t("cards.noRecentClients")}
                </p>
              ) : (
                <ul className="menu bg-base-100 rounded-box w-full">
                  {top.map((c) => (
                    <li key={c.id} className="py-1">
                      <div className="flex items-center gap-3">
                        <User2 className="text-primary" size={16} />
                        <div className="flex-1">
                          <div className="font-medium leading-5">
                            {c.nombre}
                          </div>
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
              <h2 className="card-title">⏰ {t("cards.upcoming7d")}</h2>
              {seg.length === 0 ? (
                <p className="text-sm text-base-content/60">
                  {t("cards.noUpcoming")}
                </p>
              ) : (
                <ul className="divide-y divide-base-200">
                  {seg.map((s) => {
                    const due = new Date(s.vence_en);
                    const mins = (due - Date.now()) / 60000;
                    const tone =
                      mins < 0
                        ? "badge-error"
                        : mins <= 60 * 24
                        ? "badge-warning"
                        : "badge-info";
                    return (
                      <li
                        key={s.id}
                        className="py-3 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="font-medium">{s.titulo}</div>
                          <div className="text-xs text-base-content/60">
                            {s.cliente_nombre || "—"}
                          </div>
                        </div>
                        <span
                          className={`badge ${tone} badge-outline flex items-center gap-1`}
                        >
                          {t("cards.dueAt")}{" "}
                          {due.toLocaleString(i18n.language || undefined)}
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
