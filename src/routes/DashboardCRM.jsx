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
  Brain,
  Send,
  PlugZap,
  Timer,
  AlertTriangle,
  BarChart2,
  UserX,
  Ban,
  Tag,
  PauseCircle,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

export default function DashboardCRM() {
  const { usuario } = useAuth();
  const { t, i18n } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [insightsBusy, setInsightsBusy] = useState(false);

  // -------- métricas base (dashboard + kanban/kpis) --------
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

  const [insights, setInsights] = useState({
    recomendaciones: null,
    model: null,
    source: null,
  });

  const [integraciones, setIntegraciones] = useState({
    slack: { configured: false },
    whatsapp: { configured: false },
  });

  // -------- analytics/kpis (incluye qualification) --------
  const [analytics, setAnalytics] = useState({
    range: null,
    contacts: {
      total: 0,
      new_by_day: [],
      contactability_pct: 0,
      first_touch: { p50_min: 0, p90_min: 0, avg_min: 0 },
    },
    tasks: { overdue: 0, due_next_7d: 0 },
    pipeline: { by_source: [], by_owner: [] },
    qualification: {
      total: 0,
      qualified: 0,
      rate_pct: 0,
      uncontactable: { total: 0, pct: 0 },
      no_first_touch: { total: 0, pct: 0 },
      uncategorized: { total: 0, pct: 0 },
      stalled_in_incoming: { total: 0, days: 7 },
    },
  });

  async function loadAll() {
    setIsLoading(true);
    try {
      const [dashRes, kpiRes, aiRes, intRes, anRes] = await Promise.allSettled([
        api.get("/dashboard"),
        api.get("/kanban/kpis"),
        api.get("/ai/insights"),
        api.get("/integraciones"),
        api.get("/analytics/kpis"), // KPIs avanzados
      ]);

      // Dashboard base
      if (dashRes.status === "fulfilled") {
        const dash = dashRes.value?.data ?? {};
        setMetrics(dash.metrics ?? { total_clientes: 0, total_tareas: 0, proximos_7d: 0 });
        setTop(Array.isArray(dash.topClientes) ? dash.topClientes : []);
        setSeg(Array.isArray(dash.proximosSeguimientos) ? dash.proximosSeguimientos : []);
      }

      // KPIs pipeline (won/lost/winRate + proximos7d)
      if (kpiRes.status === "fulfilled") {
        const k = kpiRes.value?.data ?? {};
        const arr =
          Array.isArray(k.clientesPorCat) && k.clientesPorCat.length
            ? k.clientesPorCat.map((x) => ({ categoria: x.categoria, total: Number(x.total) || 0 }))
            : Array.isArray(k.clientesPorStage)
            ? k.clientesPorStage.map((x) => ({ categoria: x.stage, total: Number(x.total) || 0 }))
            : [];

        const won = arr.find((x) => x.categoria === "Won")?.total ?? 0;
        const lost = arr.find((x) => x.categoria === "Lost")?.total ?? 0;
        const total = won + lost;
        const winRate = total ? Math.round((won / total) * 100) : 0;

        setKpis({
          won,
          lost,
          winRate,
          proximos7d: Number(k.proximos7d ?? k.proximos_7d ?? 0),
        });
      }

      // Insights (IA o heurísticas)
      if (aiRes.status === "fulfilled") {
        const ai = aiRes.value?.data ?? {};
        setInsights({
          recomendaciones: ai.recomendaciones ?? null,
          model: ai.model ?? null,
          source: ai.source ?? null,
        });
      } else {
        setInsights({ recomendaciones: null, model: null, source: null });
      }

      // Integraciones (estado simple)
      if (intRes.status === "fulfilled") {
        setIntegraciones(intRes.value?.data ?? { slack: { configured: false }, whatsapp: { configured: false } });
      }

      // Analytics KPIs (incluye qualification)
      if (anRes.status === "fulfilled") {
        const an = anRes.value?.data ?? {};
        const q = an.qualification ?? {};
        const qual = {
          total: Number(q.total ?? 0),
          qualified: Number(q.qualified ?? 0),
          rate_pct: Number(q.rate_pct ?? 0),
          uncontactable: {
            total: Number(q.uncontactable?.total ?? 0),
            pct: Number(q.uncontactable?.pct ?? 0),
          },
          no_first_touch: {
            total: Number(q.no_first_touch?.total ?? 0),
            pct: Number(q.no_first_touch?.pct ?? 0),
          },
          uncategorized: {
            total: Number(q.uncategorized?.total ?? 0),
            pct: Number(q.uncategorized?.pct ?? 0),
          },
          stalled_in_incoming: {
            total: Number(q.stalled_in_incoming?.total ?? 0),
            days: Number(q.stalled_in_incoming?.days ?? 7),
          },
        };

        setAnalytics({
          range: an.range ?? null,
          contacts: {
            total: Number(an.contacts?.total ?? 0),
            new_by_day: Array.isArray(an.contacts?.new_by_day) ? an.contacts.new_by_day : [],
            contactability_pct: Number(an.contacts?.contactability_pct ?? 0),
            first_touch: {
              p50_min: Math.round(Number(an.contacts?.first_touch?.p50_min ?? 0)),
              p90_min: Math.round(Number(an.contacts?.first_touch?.p90_min ?? 0)),
              avg_min: Math.round(Number(an.contacts?.first_touch?.avg_min ?? 0)),
            },
          },
          tasks: {
            overdue: Number(an.tasks?.overdue ?? 0),
            due_next_7d: Number(an.tasks?.due_next_7d ?? 0),
          },
          pipeline: {
            by_source: Array.isArray(an.pipeline?.by_source) ? an.pipeline.by_source : [],
            by_owner: Array.isArray(an.pipeline?.by_owner) ? an.pipeline.by_owner : [],
          },
          qualification: qual,
        });
      }
    } catch (e) {
      console.error("Dashboard error", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadAll();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onDispatch = async () => {
    setDispatchBusy(true);
    const id = toast.loading(t("actions.sending", "Enviando follow-ups..."));
    try {
      const { data } = await api.post("/jobs/dispatch");
      const ok = data?.ok ?? 0;
      const err = data?.err ?? 0;
      toast.success(t("actions.sentSummary", "{{ok}} enviados, {{err}} con error", { ok, err }), { id });
      await loadAll();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) {
        toast.error(t("errors.permission", "No tenés permisos para ejecutar el dispatcher."), { id });
      } else {
        toast.error(t("errors.genericSend", "No se pudo despachar follow-ups."), { id });
      }
    } finally {
      setDispatchBusy(false);
    }
  };

  const onRefreshInsights = async () => {
    setInsightsBusy(true);
    try {
      const { data } = await api.get("/ai/insights");
      setInsights({
        recomendaciones: data?.recomendaciones ?? null,
        model: data?.model ?? null,
        source: data?.source ?? null,
      });
      toast.success(t("actions.refreshed", "Insights actualizados"));
    } catch {
      toast.error(t("errors.generic", "No se pudo actualizar insights"));
    } finally {
      setInsightsBusy(false);
    }
  };

  const renderInsights = () => {
    const txt = insights.recomendaciones?.trim();
    if (!txt) {
      return (
        <p className="text-sm text-base-content/60">
          {t("insights.empty", "Aún no hay recomendaciones. Cargá clientes/tareas y volvé a intentar.")}
        </p>
      );
    }
    const lines = txt.split(/\r?\n/).map((s) => s.replace(/^[\-\*\u2022]\s*/, "").trim()).filter(Boolean);
    return (
      <ul className="list-disc pl-5 space-y-1">
        {lines.map((l, i) => (
          <li key={i} className="text-sm">{l}</li>
        ))}
      </ul>
    );
  };

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
            <h1 className="text-3xl font-bold mb-1">{t("dashboard.title", "Vex CRM — Dashboard")}</h1>
            <p className="text-sm text-base-content/70 mb-4">
              {t("dashboard.hello", { email: usuario?.email || "" })}
            </p>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={onRefreshInsights}
              disabled={insightsBusy}
              title={t("actions.refreshInsights", "Actualizar insights")}
            >
              <Brain size={16} />
              {insightsBusy ? t("actions.loading", "Cargando...") : t("actions.refreshInsights", "Actualizar insights")}
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={onDispatch}
              disabled={dispatchBusy}
              title={t("actions.dispatchNow", "Enviar follow-ups ahora")}
            >
              <Send size={16} />
              {dispatchBusy ? t("actions.sending", "Enviando...") : t("actions.dispatchNow", "Enviar follow-ups")}
            </button>
          </div>
        </div>

        {/* KPIs de Pipeline (cierre) */}
        <div className="stats shadow bg-base-100 mb-4 w-full">
          <div className="stat">
            <div className="stat-figure text-success"><Trophy size={20} /></div>
            <div className="stat-title">Won</div>
            <div className="stat-value">{kpis.won}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-error"><ThumbsDown size={20} /></div>
            <div className="stat-title">Lost</div>
            <div className="stat-value">{kpis.lost}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-info"><Percent size={20} /></div>
            <div className="stat-title">Win rate</div>
            <div className="stat-value">{kpis.winRate}%</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-accent"><BellRing size={20} /></div>
            <div className="stat-title">{t("metrics.followups7d", "Follow-ups 7d")}</div>
            <div className="stat-value">{kpis.proximos7d}</div>
          </div>
        </div>

        {/* Métricas base (reemplazamos el 3er tile por Overdue) */}
        <div className="stats shadow bg-base-100 mb-8 w-full">
          <div className="stat">
            <div className="stat-figure text-primary"><Users size={20} /></div>
            <div className="stat-title">{t("metrics.clients", "Clientes")}</div>
            <div className="stat-value">{metrics.total_clientes}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-secondary"><ClipboardList size={20} /></div>
            <div className="stat-title">{t("metrics.tasks", "Tareas")}</div>
            <div className="stat-value">{metrics.total_tareas}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-warning"><AlertTriangle size={20} /></div>
            <div className="stat-title">{t("metrics.overdue", "Overdue")}</div>
            <div className="stat-value">{analytics.tasks.overdue}</div>
          </div>
        </div>

        {/* KPIs avanzados (contactabilidad + SLA primer contacto) */}
        <div className="stats shadow bg-base-100 mb-8 w-full">
          <div className="stat">
            <div className="stat-figure text-info"><BarChart2 size={20} /></div>
            <div className="stat-title">{t("analytics.contactability", "Contactabilidad")}</div>
            <div className="stat-value">{analytics.contacts.contactability_pct}%</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-success"><Timer size={20} /></div>
            <div className="stat-title">{t("analytics.firstTouchP50", "Primer contacto (p50)")}</div>
            <div className="stat-value">
              {analytics.contacts.first_touch.p50_min}<span className="text-sm ml-1">min</span>
            </div>
          </div>
          <div className="stat">
            <div className="stat-figure text-accent"><Timer size={20} /></div>
            <div className="stat-title">{t("analytics.firstTouchAvg", "Primer contacto (avg)")}</div>
            <div className="stat-value">
              {analytics.contacts.first_touch.avg_min}<span className="text-sm ml-1">min</span>
            </div>
          </div>
        </div>

        {/* NUEVO: KPIs de Calificabilidad */}
        <div className="stats shadow bg-base-100 mb-8 w-full">
          <div className="stat">
            <div className="stat-figure text-primary"><BarChart2 size={20} /></div>
            <div className="stat-title">{t("analytics.leadsRange", "Leads (rango)")}</div>
            <div className="stat-value">{analytics.qualification.total}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-success"><Trophy size={20} /></div>
            <div className="stat-title">{t("analytics.qualified", "Qualified")}</div>
            <div className="stat-value">{analytics.qualification.qualified}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-info"><Percent size={20} /></div>
            <div className="stat-title">{t("analytics.qualRate", "Rate")}</div>
            <div className="stat-value">{analytics.qualification.rate_pct}%</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-error"><UserX size={20} /></div>
            <div className="stat-title">
              {t("analytics.uncontactable", "No contactables")}
              <span className="text-xs block opacity-60">({analytics.qualification.uncontactable.pct}%)</span>
            </div>
            <div className="stat-value">{analytics.qualification.uncontactable.total}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-warning"><Timer size={20} /></div>
            <div className="stat-title">
              {t("analytics.noFirstTouch", "Sin primer contacto")}
              <span className="text-xs block opacity-60">({analytics.qualification.no_first_touch.pct}%)</span>
            </div>
            <div className="stat-value">{analytics.qualification.no_first_touch.total}</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-accent"><Tag size={20} /></div>
            <div className="stat-title">
              {t("analytics.uncategorized", "Sin stage/pipeline")}
              <span className="text-xs block opacity-60">({analytics.qualification.uncategorized.pct}%)</span>
            </div>
            <div className="stat-value">{analytics.qualification.uncategorized.total}</div>
          </div>
        </div>

        {/* Estancados en Incoming — lo separamos para remarcar el umbral */}
        <div className="stats shadow bg-base-100 mb-8 w-full">
          <div className="stat">
            <div className="stat-figure text-neutral"><PauseCircle size={20} /></div>
            <div className="stat-title">
              {t("analytics.stalledIncoming", "Estancados en Incoming ≥ {{d}} días", {
                d: analytics.qualification.stalled_in_incoming.days,
              })}
            </div>
            <div className="stat-value">{analytics.qualification.stalled_in_incoming.total}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top clientes recientes */}
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">🆕 {t("cards.topRecentClients", "Clientes recientes")}</h2>
              {top.length === 0 ? (
                <p className="text-sm text-base-content/60">{t("cards.noRecentClients", "No hay clientes recientes.")}</p>
              ) : (
                <ul className="menu bg-base-100 rounded-box w-full">
                  {top.map((c) => (
                    <li key={c.id} className="py-1">
                      <div className="flex items-center gap-3">
                        <User2 className="text-primary" size={16} />
                        <div className="flex-1">
                          <div className="font-medium leading-5">{c.nombre}</div>
                          <div className="text-xs text-base-content/60">
                            {(c.email || "—")} • {(c.telefono || "—")}
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
              <h2 className="card-title">⏰ {t("cards.upcoming7d", "Próximos 7 días")}</h2>
              {seg.length === 0 ? (
                <p className="text-sm text-base-content/60">{t("cards.noUpcoming", "No hay tareas próximas.")}</p>
              ) : (
                <ul className="divide-y divide-base-200">
                  {seg.map((s) => {
                    const due = new Date(s.vence_en);
                    const mins = (due - Date.now()) / 60000;
                    const tone = mins < 0 ? "badge-error" : mins <= 60 * 24 ? "badge-warning" : "badge-info";
                    return (
                      <li key={s.id} className="py-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{s.titulo}</div>
                          <div className="text-xs text-base-content/60">{s.cliente_nombre || "—"}</div>
                        </div>
                        <span className={`badge ${tone} badge-outline flex items-center gap-1`}>
                          {t("cards.dueAt", "Vence")} {due.toLocaleString(i18n.language || undefined)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Win rate por Source */}
          <section className="card bg-base-100 shadow lg:col-span-1">
            <div className="card-body">
              <h2 className="card-title">{t("analytics.bySource", "Win rate por Source")}</h2>
              {analytics.pipeline.by_source.length === 0 ? (
                <p className="text-sm text-base-content/60">{t("common.noData", "Sin datos")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{t("common.source", "Origen")}</th>
                        <th>Won</th>
                        <th>Lost</th>
                        <th>Win%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.pipeline.by_source.map((r, i) => (
                        <tr key={i}>
                          <td>{r.source}</td>
                          <td>{r.won}</td>
                          <td>{r.lost}</td>
                          <td>{r.win_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Win rate por Owner */}
          <section className="card bg-base-100 shadow lg:col-span-1">
            <div className="card-body">
              <h2 className="card-title">{t("analytics.byOwner", "Win rate por Owner")}</h2>
              {analytics.pipeline.by_owner.length === 0 ? (
                <p className="text-sm text-base-content/60">{t("common.noData", "Sin datos")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{t("common.assignee", "Responsable")}</th>
                        <th>Won</th>
                        <th>Lost</th>
                        <th>Win%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.pipeline.by_owner.map((r, i) => (
                        <tr key={i}>
                          <td>{r.owner}</td>
                          <td>{r.won}</td>
                          <td>{r.lost}</td>
                          <td>{r.win_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Insights */}
          <section className="card bg-base-100 shadow lg:col-span-2">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h2 className="card-title flex items-center gap-2">
                  <Brain size={18} />
                  {t("cards.insights", "Insights del negocio")}
                  {insights.model ? (
                    <span className="badge badge-outline">{insights.model}</span>
                  ) : (
                    <span className="badge badge-ghost">{t("insights.baseline", "Baseline")}</span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="badge badge-ghost flex items-center gap-1">
                    <PlugZap size={14} />
                    {integraciones?.slack?.configured ? "Slack ON" : "Slack OFF"}
                  </span>
                  <span className="badge badge-ghost">
                    {integraciones?.whatsapp?.configured ? "WhatsApp ON" : "WhatsApp OFF"}
                  </span>
                </div>
              </div>
              {renderInsights()}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
