// vex-crm-fronend/src/routes/DashboardCRM.jsx
import { useEffect, useMemo, useState } from "react";
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
  LineChart as LineIcon,
  PieChart,
  SlidersHorizontal,
} from "lucide-react";
import api from "../utils/api";
import { useArea } from "../context/AreaContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

const RANGE_OPTS = [
  { key: "30", label: "30d" },
  { key: "90", label: "90d" },
  { key: "365", label: "1y" },
  { key: "all", label: "Todo" },
];

const todayISOOffset = (daysBack = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString();
};

const buildRangeParams = (rangeKey) => {
  if (rangeKey === "all") return { from: "1970-01-01T00:00:00.000Z", to: todayISOOffset(0) };
  const days = Number(rangeKey) || 30;
  return { from: todayISOOffset(days), to: todayISOOffset(0) };
};

const sum = (arr = [], fn = (x) => x) => (arr || []).reduce((a, b) => a + (Number(fn(b)) || 0), 0);

function DonutChart({ won = 0, lost = 0, other = 0 }) {
  const total = Math.max(won + lost + other, 0.0001);
  const toDeg = (v) => (v / total) * 360;
  const wonDeg = toDeg(won);
  const lostDeg = toDeg(lost);
  const otherDeg = 360 - (wonDeg + lostDeg);
  const slices = [
    { deg: wonDeg, color: "#22c55e" },
    { deg: lostDeg, color: "#ef4444" },
    { deg: otherDeg, color: "#a855f7" },
  ].filter((s) => s.deg > 0.5);
  let start = 0;
  const radius = 30;
  const view = 2 * (radius + 4);
  return (
    <svg width={view} height={view} viewBox={`0 0 ${view} ${view}`}>
      <g transform={`translate(${view / 2},${view / 2})`}>
        {slices.map((s, i) => {
          const end = start + s.deg;
          const large = s.deg > 180 ? 1 : 0;
          const x1 = radius * Math.cos((Math.PI * start) / 180);
          const y1 = radius * Math.sin((Math.PI * start) / 180);
          const x2 = radius * Math.cos((Math.PI * end) / 180);
          const y2 = radius * Math.sin((Math.PI * end) / 180);
          const d = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
          start = end;
          return <path key={i} d={d} fill={s.color} opacity={0.9} />;
        })}
        <circle r={14} fill="white" />
      </g>
    </svg>
  );
}

function BarRow({ label, value, total, color = "#2563eb" }) {
  const pct = total > 0 ? Math.round((value * 100) / total) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="truncate">{label}</span>
        <span className="text-base-content/70">{pct}%</span>
      </div>
      <div className="h-2 rounded bg-base-200 overflow-hidden">
        <div
          className="h-full"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color, opacity: 0.85 }}
        />
      </div>
    </div>
  );
}

function LineChart({ series = [], color = "#2563eb" }) {
  if (!series.length) return <div className="text-xs text-base-content/60">Sin datos</div>;
  const w = 320;
  const h = 120;
  const xs = series.map((_, i) => i);
  const ys = series.map((p) => Number(p.value) || 0);
  const maxY = Math.max(...ys, 1);
  const stepX = xs.length > 1 ? w / (xs.length - 1) : w;
  const points = series
    .map((p, i) => {
      const x = i * stepX;
      const y = h - (Number(p.value) || 0) * (h / maxY);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="w-full">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      {series.map((p, i) => {
        const x = i * stepX;
        const y = h - (Number(p.value) || 0) * (h / maxY);
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

function InsightsBlock({ insights, t }) {
  const txt = insights.recomendaciones?.trim();
  if (!txt) {
    return (
      <p className="text-sm text-base-content/60">
        {t("insights.empty", "Aun no hay recomendaciones. Carga clientes/tareas y volve a intentar.")}
      </p>
    );
  }
  const lines = txt
    .split(/\r?\n/)
    .map((s) => s.replace(/^[\-\*\u2022]\s*/, "").trim())
    .filter(Boolean);
  return (
    <ul className="list-disc pl-5 space-y-1">
      {lines.map((l, i) => (
        <li key={i} className="text-sm">
          {l}
        </li>
      ))}
    </ul>
  );
}

export default function DashboardCRM() {
  const { usuario } = useAuth();
  const { t, i18n } = useTranslation();
  const { area } = useArea();
  const isVet = (area || "").toLowerCase() === "veterinaria";

  const [range, setRange] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [insightsBusy, setInsightsBusy] = useState(false);

  const [metrics, setMetrics] = useState({
    total_clientes: 0,
    total_tareas: 0,
    proximos_7d: 0,
    total_proyectos: 0,
  });

  const [kpis, setKpis] = useState({
    won: 0,
    lost: 0,
    winRate: 0,
    proximos7d: 0,
    unqualified: 0,
    followup_missed: 0,
  });

  const [top, setTop] = useState([]);
  const [seg, setSeg] = useState([]);
  const [vacunas, setVacunas] = useState([]);

  const [insights, setInsights] = useState({
    recomendaciones: null,
    model: null,
    source: null,
  });

  const [integraciones, setIntegraciones] = useState({
    slack: { configured: false },
    whatsapp: { configured: false },
  });

  const [analytics, setAnalytics] = useState({
    range: null,
    contacts: {
      total: 0,
      new_by_day: [],
      contactability_pct: 0,
      first_touch: { p50_min: 0, p90_min: 0, avg_min: 0 },
    },
    tasks: { overdue: 0, due_next_7d: 0 },
    pipeline: { by_source: [], by_owner: [], summary: { stages: [] } },
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

  const isOk = (r) => r?.status === "fulfilled" && r.value?.status >= 200 && r.value?.status < 300;
  const is304 = (r) => r?.status === "fulfilled" && r.value?.status === 304;

  async function loadAll(signal) {
    setIsLoading(true);
    try {
      const nc = { params: { _t: Date.now(), ...buildRangeParams(range) }, signal };

      const [dashRes, aiRes, intRes, anRes] = await Promise.allSettled([
        api.get("/dashboard", nc),
        api.get("/ai/insights", nc),
        api.get("/integraciones", nc),
        api.get("/analytics/kpis", nc),
      ]);

      if (isOk(dashRes)) {
        const d = dashRes.value.data ?? {};
        const m = d.metrics ?? {};
        const proximos = Number(m.proximos_7d ?? m.followups_7d ?? m.proximos7d ?? m.followups7d ?? 0);
        setMetrics((prev) => ({
          ...prev,
          total_clientes: Number(m.total_clientes ?? prev.total_clientes ?? 0),
          total_tareas: Number(m.total_tareas ?? prev.total_tareas ?? 0),
          proximos_7d: Number.isFinite(proximos) ? proximos : prev.proximos_7d ?? 0,
          total_proyectos: Number(m.total_proyectos ?? prev.total_proyectos ?? 0),
        }));
        setTop(Array.isArray(d.topClientes) ? d.topClientes : []);
        setSeg(Array.isArray(d.proximosSeguimientos) ? d.proximosSeguimientos : []);
        setVacunas(Array.isArray(d.vacunas) ? d.vacunas : []);
      }

      if (isOk(aiRes)) {
        const ai = aiRes.value.data ?? {};
        setInsights({
          recomendaciones: ai.recomendaciones ?? null,
          model: ai.model ?? null,
          source: ai.source ?? null,
        });
      }

      if (isOk(intRes)) {
        const iv = intRes.value.data ?? {};
        setIntegraciones({
          slack: iv?.slack ?? { configured: false },
          whatsapp: iv?.whatsapp ?? { configured: false },
        });
      }

      if (isOk(anRes)) {
        const an = anRes.value.data ?? {};
        const won = Number(an?.pipeline?.summary?.won ?? 0);
        const lost = Number(an?.pipeline?.summary?.lost ?? 0);
        const winRate = Number(an?.pipeline?.summary?.win_rate ?? 0);
        const stages = Array.isArray(an?.pipeline?.summary?.stages) ? an.pipeline.summary.stages : [];
        const getStageCount = (name) => Number(stages.find((r) => r.stage === name)?.total ?? 0);
        const unqualified = getStageCount("Unqualified");
        const followup_missed = getStageCount("Follow-up Missed");
        const proximos7d = Number(an?.tasks?.due_next_7d ?? 0);

        setKpis({ won, lost, winRate, proximos7d, unqualified, followup_missed });

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
            summary: an.pipeline?.summary || { stages: [] },
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
    const controller = new AbortController();
    (async () => {
      await loadAll(controller.signal);
    })();
    return () => controller.abort();
  }, [range]);

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
        toast.error(t("errors.permission", "No tenes permisos para ejecutar el dispatcher."), { id });
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
      const { data } = await api.get("/ai/insights", { params: { _t: Date.now() } });
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

  const leadsSeries = useMemo(() => {
    return (analytics.contacts.new_by_day || []).map((p) => ({
      label: p.dia || "",
      value: p.nuevos || 0,
    }));
  }, [analytics.contacts.new_by_day]);

  const totalStages = useMemo(
    () => sum(analytics?.pipeline?.summary?.stages || [], (s) => s.total),
    [analytics]
  );

  const vaccineList = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return (vacunas || []).map((v) => {
      const fecha = v.proxima_vacuna ? new Date(v.proxima_vacuna) : null;
      const days = fecha ? Math.floor((fecha - today) / 86400000) : null;
      let tone = "badge-success";
      if (days == null) tone = "badge-ghost";
      else if (days <= 3) tone = "badge-error";
      else if (days <= 7) tone = "badge-warning";
      else tone = "badge-success";
      return { ...v, days, tone, fecha };
    });
  }, [vacunas]);

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
            <h1 className="text-3xl font-bold mb-1">{t("dashboard.title", "Vex CRM - Dashboard")}</h1>
            <p className="text-sm text-base-content/70 mb-4">{t("dashboard.hello", { email: usuario?.email || "" })}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-2 bg-base-100 px-3 py-1 rounded-full border border-base-300">
              <SlidersHorizontal size={16} />
              <span className="text-sm">Rango</span>
              <select
                className="select select-ghost select-sm"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                {RANGE_OPTS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-outline btn-sm" onClick={onRefreshInsights} disabled={insightsBusy}>
              <Brain size={16} />
              {insightsBusy ? t("actions.loading", "Cargando...") : t("actions.refreshInsights", "Actualizar insights")}
            </button>
            <button className="btn btn-primary btn-sm" onClick={onDispatch} disabled={dispatchBusy}>
              <Send size={16} />
              {dispatchBusy ? t("actions.sending", "Enviando...") : t("actions.dispatchNow", "Enviar follow-ups")}
            </button>
          </div>
        </div>

        {/* Primera fila: pipeline (y win/loss solo fuera de veterinaria) */}
        <div className={`grid grid-cols-1 ${isVet ? "lg:grid-cols-1" : "lg:grid-cols-3"} gap-6 mb-6`}>
          {!isVet ? (
            <div className="card bg-base-100 shadow col-span-1">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-base-content/60 flex items-center gap-1">
                      <PieChart size={16} /> Won / Lost
                    </div>
                    <div className="text-2xl font-semibold">{kpis.winRate}% win rate</div>
                  </div>
                  <DonutChart won={kpis.won} lost={kpis.lost} other={kpis.unqualified} />
                </div>
                <div className="flex gap-3 text-sm mt-3 flex-wrap">
                  <span className="badge badge-success gap-1"><Trophy size={14} />{kpis.won} Won</span>
                  <span className="badge badge-error gap-1"><ThumbsDown size={14} />{kpis.lost} Lost</span>
                  <span className="badge badge-neutral gap-1"><Ban size={14} />{kpis.unqualified} Unqualified</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className={`card bg-base-100 shadow ${isVet ? "col-span-1" : "col-span-2"}`}>
            <div className="card-body">
              <div className="flex items-center gap-2 text-sm text-base-content/60 mb-2">
                <LineIcon size={16} /> Pipeline por stage
              </div>
              {totalStages === 0 ? (
                <p className="text-sm text-base-content/60">Sin datos en el rango.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(analytics?.pipeline?.summary?.stages || []).map((s, i) => (
                    <BarRow key={i} label={s.stage} value={s.total} total={totalStages} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Segunda fila: contadores y contactabilidad */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat shadow bg-base-100">
            <div className="stat-figure text-primary"><Users size={20} /></div>
            <div className="stat-title">{t("metrics.clients", "Clientes")}</div>
            <div className="stat-value">{metrics.total_clientes}</div>
          </div>
          <div className="stat shadow bg-base-100">
            <div className="stat-figure text-info"><Tag size={20} /></div>
            <div className="stat-title">{t("metrics.projects", "Proyectos")}</div>
            <div className="stat-value">{metrics.total_proyectos}</div>
          </div>
          <div className="stat shadow bg-base-100">
            <div className="stat-figure text-secondary"><ClipboardList size={20} /></div>
            <div className="stat-title">{t("metrics.tasks", "Tareas")}</div>
            <div className="stat-value">{metrics.total_tareas}</div>
          </div>
          <div className="stat shadow bg-base-100">
            <div className="stat-figure text-warning"><AlertTriangle size={20} /></div>
            <div className="stat-title">{t("metrics.overdue", "Overdue")}</div>
            <div className="stat-value">{analytics.tasks.overdue}</div>
          </div>
        </div>

        {/* Leads y contactabilidad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex items-center justify-between mb-2">
                <h2 className="card-title flex items-center gap-2">
                  <LineIcon size={18} /> Leads creados
                </h2>
                <span className="badge badge-outline">{analytics.contacts.total} en rango</span>
              </div>
              <LineChart series={leadsSeries} color="#3b82f6" />
            </div>
          </section>
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <BarChart2 size={18} /> {t("analytics.contactability", "Contactabilidad")}
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-semibold">{analytics.contacts.contactability_pct}%</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Timer size={16} /> p50: {analytics.contacts.first_touch.p50_min} min
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer size={16} /> avg: {analytics.contacts.first_touch.avg_min} min
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Win rate por Source/Owner en barras */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Percent size={18} /> Win rate por Source
              </h2>
              {analytics.pipeline.by_source.length === 0 ? (
                <p className="text-sm text-base-content/60">{t("common.noData", "Sin datos")}</p>
              ) : (
                <div className="space-y-3">
                  {analytics.pipeline.by_source.map((r, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{r.source}</span>
                        <span>{r.win_rate}% ({r.won}/{r.lost})</span>
                      </div>
                      <div className="h-2 bg-base-200 rounded overflow-hidden">
                        <div className="h-full bg-success" style={{ width: `${Math.min(100, r.win_rate)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <User2 size={18} /> Win rate por Owner
              </h2>
              {analytics.pipeline.by_owner.length === 0 ? (
                <p className="text-sm text-base-content/60">{t("common.noData", "Sin datos")}</p>
              ) : (
                <div className="space-y-3">
                  {analytics.pipeline.by_owner.map((r, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{r.owner}</span>
                        <span>{r.win_rate}% ({r.won}/{r.lost})</span>
                      </div>
                      <div className="h-2 bg-base-200 rounded overflow-hidden">
                        <div className="h-full bg-info" style={{ width: `${Math.min(100, r.win_rate)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Calificabilidad + incoming */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <BarChart2 size={18} /> Calificacion
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded bg-base-200">
                  <div className="text-xs text-base-content/60">{t("analytics.leadsRange", "Leads (rango)")}</div>
                  <div className="text-xl font-semibold">{analytics.qualification.total}</div>
                </div>
                <div className="p-3 rounded bg-base-200">
                  <div className="text-xs text-base-content/60">{t("analytics.qualified", "Qualified")}</div>
                  <div className="text-xl font-semibold">{analytics.qualification.qualified}</div>
                </div>
                <div className="p-3 rounded bg-base-200">
                  <div className="text-xs text-base-content/60">{t("analytics.qualRate", "Rate")}</div>
                  <div className="text-xl font-semibold">{analytics.qualification.rate_pct}%</div>
                </div>
                <div className="p-3 rounded bg-base-200">
                  <div className="text-xs text-base-content/60">{t("analytics.uncontactable", "No contactables")}</div>
                  <div className="text-xl font-semibold">{analytics.qualification.uncontactable.total}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Timer size={18} /> Sin primer contacto
              </h2>
              <p className="text-3xl font-semibold">{analytics.qualification.no_first_touch.total}</p>
              <p className="text-sm text-base-content/60">{analytics.qualification.no_first_touch.pct}% del rango.</p>
            </div>
          </section>

          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <PauseCircle size={18} /> Incoming estancados
              </h2>
              <p className="text-3xl font-semibold">{analytics.qualification.stalled_in_incoming.total}</p>
              <p className="text-sm text-base-content/60">+{analytics.qualification.stalled_in_incoming.days} dias sin tareas.</p>
            </div>
          </section>
        </div>

        {/* Listas: clientes recientes / tareas / vacunas (vet: vacunas primero) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(isVet
            ? ["vacunas", "tareas", "clientes"]
            : ["clientes", "tareas", "vacunas"]
          ).map((slot) => {
            if (slot === "clientes") {
              return (
                <section key="clientes" className="card bg-base-100 shadow">
                  <div className="card-body">
                    <h2 className="card-title">{t("cards.topRecentClients", "Clientes recientes")}</h2>
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
                                  {(c.email || "-")} / {(c.telefono || "-")}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              );
            }
            if (slot === "tareas") {
              return (
                <section key="tareas" className="card bg-base-100 shadow">
                  <div className="card-body">
                    <h2 className="card-title">{t("cards.upcoming7d", "Proximos 7 dias")}</h2>
                    {seg.length === 0 ? (
                      <p className="text-sm text-base-content/60">{t("cards.noUpcoming", "No hay tareas proximas.")}</p>
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
                                <div className="text-xs text-base-content/60">{s.cliente_nombre || "-"}</div>
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
              );
            }
            return (
              <section key="vacunas" className="card bg-base-100 shadow">
                <div className="card-body">
                  <h2 className="card-title">Vacunas (14/7/3)</h2>
                  {vaccineList.length === 0 ? (
                    <p className="text-sm text-base-content/60">Sin vacunas pendientes.</p>
                  ) : (
                    <ul className="divide-y divide-base-200">
                      {vaccineList.map((v) => (
                        <li key={v.id} className="py-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{v.nombre || "Mascota"}</div>
                            <div className="text-xs text-base-content/60 truncate">{v.cliente_nombre || "Dueno no informado"}</div>
                            {v.peso ? <div className="text-xs text-base-content/70">Peso: {v.peso} kg</div> : null}
                            {v.vacunas ? <div className="text-xs text-base-content/70 truncate">Vacunas: {v.vacunas}</div> : null}
                          </div>
                          <div className="text-right space-y-1">
                            <div className={`badge ${v.tone} badge-outline`}>{v.days != null ? `${v.days} d` : "--"}</div>
                            <div className="text-xs text-base-content/60">{v.fecha ? v.fecha.toLocaleDateString(i18n.language || undefined) : "Sin fecha"}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <section className="card bg-base-100 shadow mt-6">
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
            <InsightsBlock insights={insights} t={t} />
          </div>
        </section>
      </div>
    </div>
  );
}
