// src/routes/ProyectosKanban.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchProyectosKanban, moveProyecto } from "../utils/vexKanbanApi";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import {
  CalendarClock,
  Mail,
  Phone,
  Paperclip,
  UserCircle2,
  ChevronRight,
  X,
  Search,
  Clock3,
  Building2,
  Tag,
} from "lucide-react";

/* ─────────────── Pipeline canónico (BE) ─────────────── */
const PIPELINE = [
  "Incoming Leads",
  "Unqualified",
  "Qualified",
  "Follow-up Missed",
  "Bid/Estimate Sent",
  "Won",
  "Lost",
];

/* ─────────────── Utils ─────────────── */
function sortByDueCreated(items = [], dueKey = "fecha_cierre_estimada") {
  const arr = [...items];
  arr.sort((a, b) => {
    const da = a[dueKey] ? new Date(a[dueKey]).getTime() : Infinity;
    const db = b[dueKey] ? new Date(b[dueKey]).getTime() : Infinity;
    if (da !== db) return da - db;
    const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
    const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return cb - ca;
  });
  return arr;
}

function qs(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (String(v).trim() === "") return;
    p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

/* ─────────────── Badges ─────────────── */
function DueBadge({ date, compact, labelOverride }) {
  const { t } = useTranslation();
  if (!date) return null;
  const due = new Date(date);
  const mins = (due.getTime() - Date.now()) / 60000;
  let tone = "badge-info";
  let label = labelOverride || t("common.badges.due");
  if (mins < 0) {
    tone = "badge-error";
    label = labelOverride || t("common.badges.overdue");
  } else if (mins <= 60 * 24) {
    tone = "badge-warning";
    label = labelOverride || t("common.badges.dueToday");
  }
  return (
    <span className={`badge ${tone} ${compact ? "badge-xs" : "badge-sm"} badge-outline`}>
      <CalendarClock size={12} className="mr-1" />
      {label}: {due.toLocaleString()}
    </span>
  );
}

function EstimateChip({ url, compact, amount, currency }) {
  const { t } = useTranslation();
  if (!url && amount == null) return null;
  const text =
    amount != null
      ? `${t("common.badges.estimate")}: ${amount}${currency ? ` ${currency}` : ""}`
      : t("common.badges.estimate");
  const inner = (
    <span
      className={`badge badge-primary ${compact ? "badge-xs" : "badge-sm"} badge-outline no-underline`}
      title={t("clients.list.viewEstimate")}
    >
      <Paperclip size={12} className="mr-1" />
      {text}
    </span>
  );
  if (!url) return inner;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="no-underline"
      onClick={(e) => e.stopPropagation()}
    >
      {inner}
    </a>
  );
}

/* ─────────────── Filtros con persistencia en URL ─────────────── */
function useQueryState() {
  const [state, setState] = useState(() => {
    const u = new URL(window.location.href);
    return {
      q: u.searchParams.get("q") || "",
      cliente_id: u.searchParams.get("cliente_id") || "",
      stage: u.searchParams.get("stage") || "",
    };
  });

  useEffect(() => {
    const current = new URL(window.location.href);
    const next = new URL(window.location.href);
    Object.entries(state).forEach(([k, v]) => {
      if (!v) next.searchParams.delete(k);
      else next.searchParams.set(k, String(v));
    });
    if (next.search !== current.search) {
      window.history.replaceState({}, "", `${next.pathname}${next.search}`);
    }
  }, [state]);

  return [state, setState];
}

function FiltersBar({ value, onChange, onClear, right }) {
  const { t } = useTranslation();
  const [typing, setTyping] = useState(value.q);
  useEffect(() => {
    const tmo = setTimeout(() => onChange({ ...value, q: typing }), 350);
    return () => clearTimeout(tmo);
  }, [typing]); // eslint-disable-line

  return (
    <div className="mb-4 rounded-2xl bg-base-200 border border-base-300 p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-[220px]">
        <Search size={16} className="opacity-70" />
        <input
          className="input input-sm input-bordered w-full"
          placeholder={t("pipeline.filters.searchPlaceholder")}
          value={typing}
          onChange={(e) => setTyping(e.target.value)}
        />
      </div>

      <div className="flex gap-2 items-center">
        <select
          className="select select-sm select-bordered"
          value={value.stage}
          onChange={(e) => onChange({ ...value, stage: e.target.value })}
        >
          <option value="">{t("pipeline.filters.stageAll", "Todas las etapas")}</option>
          {PIPELINE.map((s) => (
            <option key={s} value={s}>
              {t(`common.stages.${s}`, s)}
            </option>
          ))}
        </select>

        <input
          className="input input-sm input-bordered w-44"
          placeholder={t("projects.filters.clientId", "Cliente ID")}
          value={value.cliente_id}
          onChange={(e) => onChange({ ...value, cliente_id: e.target.value })}
        />

        {value.q || value.stage || value.cliente_id ? (
          <button className="btn btn-sm" onClick={onClear}>
            <X size={16} /> {t("actions.clear")}
          </button>
        ) : (
          <div className="btn btn-sm btn-ghost no-animation">
            {t("pipeline.filters.title")}
          </div>
        )}

        {right}
      </div>
    </div>
  );
}

/* ─────────────── Detalle (modal) ─────────────── */
function DetailModal({ open, onClose, item }) {
  const { t } = useTranslation();
  if (!open || !item) return null;
  const stageLabel = (s) => t(`common.stages.${s}`, s);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-base-100 shadow-xl border border-base-300 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">
              {item.nombre || t("common.noData")}
            </h3>
            {item.cliente_id && (
              <div className="text-sm opacity-70 truncate flex items-center gap-1">
                <Building2 size={14} /> ID Cliente: {item.cliente_id}
              </div>
            )}
          </div>
          <button className="btn btn-sm" onClick={onClose}>
            <X size={16} /> {t("actions.close")}
          </button>
        </div>

        {item.descripcion && (
          <div className="mt-3 rounded-xl bg-base-200 p-3 text-sm whitespace-pre-wrap">
            {item.descripcion}
          </div>
        )}

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-base-200 p-3">
            <div className="text-sm font-medium mb-2">{t("projects.modal.meta", "Detalles")}</div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="badge badge-outline">{stageLabel(item.stage)}</span>
              <EstimateChip
                url={item.estimate_url}
                amount={item.estimate_amount}
                currency={item.estimate_currency}
              />
              {item.prob_win != null && (
                <span className="badge badge-outline">
                  {t("projects.fields.probWin", "Prob. win")}: {item.prob_win}%
                </span>
              )}
              <DueBadge
                date={item.fecha_cierre_estimada}
                labelOverride={t("projects.fields.closeDate", "Cierre est.")}
              />
            </div>
          </div>

          <div className="rounded-xl bg-base-200 p-3">
            <div className="text-sm font-medium mb-2">{t("pipeline.modals.contact")}</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={14} /> {item.email || "—"}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} /> {item.telefono || "—"}
              </div>
              {item.assignee && (
                <div className="flex items-center gap-2">
                  <UserCircle2 size={14} /> {item.assignee}
                </div>
              )}
              {item.source && (
                <div className="flex items-center gap-2">
                  <Tag size={14} /> {t(`common.sources.${item.source}`, item.source)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs opacity-60 flex items-center gap-3">
          <Clock3 size={12} /> {t("common.createdAt")}:{" "}
          {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Página principal ─────────────── */
export default function ProyectosKanban() {
  const { t } = useTranslation();
  const [filters, setFilters] = useQueryState();
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const colMap = useMemo(() => new Map(cols.map((c) => [c.key, c])), [cols]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // Modo compacto (persistente)
  const [compact, setCompact] = useState(() => {
    try {
      const v = localStorage.getItem("vex_pipeline_compact");
      return v == null ? true : v === "1";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("vex_pipeline_compact", compact ? "1" : "0");
    } catch {}
  }, [compact]);

  // Anti-flicker & cancelación de requests en vuelo
  const firstLoadRef = useRef(true);
  const inflightRef = useRef(0);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function reload() {
    const myReq = ++inflightRef.current;
    const showSkeleton = firstLoadRef.current || cols.length === 0;
    if (showSkeleton) setLoading(true);

    try {
      const beParams = {
        q: filters.q || undefined,
        stage: filters.stage || undefined,
        cliente_id: filters.cliente_id || undefined,
      };

      // 1) columnas del kanban (proyectos)
      const data = await fetchProyectosKanban(beParams);
      if (myReq !== inflightRef.current) return;

      // 2) enriquecemos con /proyectos; si BE no banca filtros, hacemos fallback
      let fullList = [];
      try {
        const res = await api.get(`/proyectos${qs(beParams)}`);
        const payload = res.data;
        fullList = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
      } catch {
        const res = await api.get(`/proyectos`);
        const payload = res.data;
        fullList = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
        // filtros FE simples
        if (filters.q) {
          const qv = filters.q.toLowerCase().trim();
          fullList = fullList.filter(
            (p) =>
              (p.nombre || "").toLowerCase().includes(qv) ||
              (p.descripcion || "").toLowerCase().includes(qv)
          );
        }
        if (filters.stage) fullList = fullList.filter((p) => p.stage === filters.stage);
        if (filters.cliente_id) fullList = fullList.filter((p) => String(p.cliente_id || "") === String(filters.cliente_id));
      }
      if (myReq !== inflightRef.current) return;

      const byId = new Map(fullList.map((p) => [p.id, p]));

      let ordered = [];
      if (Array.isArray(data?.columns)) {
        const byKey = new Map(
          (data.columns || []).map((c) => {
            const key = c.key || c.title;
            const items = sortByDueCreated(
              (c.items || []).map((i) => ({ ...i, ...(byId.get(i.id) || {}) }))
            );
            return [key, { ...c, key, items, count: items.length }];
          })
        );
        const order = data.order?.length
          ? data.order
          : (data.columns || []).map((c) => c.key || c.title);
        ordered = (order.length ? order : PIPELINE).map(
          (k) => byKey.get(k) || { key: k, title: k, count: 0, items: [] }
        );
      } else {
        const order = data?.order?.length ? data.order : PIPELINE;
        ordered = order.map((k) => {
          const base = Array.isArray(data?.columns?.[k]) ? data.columns[k] : [];
          const items = sortByDueCreated(base.map((i) => ({ ...i, ...(byId.get(i.id) || {}) })));
          return { key: k, title: k, items, count: items.length };
        });
      }

      ordered.forEach((c) => (c.count = c.items.length));
      if (myReq === inflightRef.current) setCols(ordered);
    } catch (e) {
      console.error(e);
      toast.error(t("pipeline.toasts.loadError"));
    } finally {
      if (myReq === inflightRef.current && (firstLoadRef.current || cols.length === 0)) {
        setLoading(false);
        firstLoadRef.current = false;
      }
    }
  }

  // DnD nativo
  function onDragStart(e, item, fromKey) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, fromKey }));
    e.dataTransfer.effectAllowed = "move";
  }

  async function onDrop(e, toKey) {
    e.preventDefault();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (!payload.id) return;
    if (payload.fromKey === toKey) return;
    await doMove(payload.id, payload.fromKey, toKey);
  }

  const nextStageOf = (current) => {
    const i = PIPELINE.indexOf(current);
    if (i < 0) return PIPELINE[0];
    return PIPELINE[Math.min(i + 1, PIPELINE.length - 1)];
  };

  async function doMove(id, fromKey, toKey) {
    try {
      await moveProyecto(id, toKey);
      setCols((prev) => {
        const copy = prev.map((c) => ({ ...c, items: [...c.items] }));
        const from = copy.find((c) => c.key === fromKey);
        const to = copy.find((c) => c.key === toKey);
        if (!from || !to) return prev;
        const idx = from.items.findIndex((x) => x.id === id);
        if (idx >= 0) {
          const [itm] = from.items.splice(idx, 1);
          itm.categoria = toKey; // espejo por compat
          itm.stage = toKey;
          to.items.unshift(itm);
          to.items = sortByDueCreated(to.items);
        }
        from.count = from.items.length;
        to.count = to.items.length;
        return copy;
      });
      toast.success(t("pipeline.toasts.moved", { stage: t(`common.stages.${toKey}`, toKey) }));
    } catch {
      toast.error(t("pipeline.toasts.moveError"));
    }
  }

  // Layout dinámico
  const colCount = cols?.length || PIPELINE.length;
  const gridStyle = { gridTemplateColumns: `repeat(${colCount}, minmax(240px,1fr))` };

  if (loading)
    return (
      <div className="p-4">
        <div className="skeleton h-9 w-56 mb-4" />
        <div className="grid gap-3" style={gridStyle}>
          {Array.from({ length: colCount }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-base-200 border border-base-300 min-h-[280px] p-3">
              <div className="skeleton h-6 w-32 mb-2" />
              <div className="skeleton h-16 w-full mb-2" />
              <div className="skeleton h-16 w-full mb-2" />
              <div className="skeleton h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    );

  const stageLabel = (s) => t(`common.stages.${s}`, s);

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proyectos</h1>
        <label className="label cursor-pointer gap-2">
          <span className="text-sm opacity-80">{t("ui.compact", "Compacto")}</span>
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={compact}
            onChange={() => setCompact((v) => !v)}
          />
        </label>
      </div>

      <FiltersBar
        value={filters}
        onChange={setFilters}
        onClear={() => setFilters({ q: "", stage: "", cliente_id: "" })}
      />

      <div className="grid gap-3" style={gridStyle}>
        {cols.map((col) => (
          <Column
            key={col.key}
            title={`${stageLabel(col.key)} ${col.count ? `(${col.count})` : ""}`}
            onDrop={(e) => onDrop(e, col.key)}
          >
            {col.items.map((item) => (
              <Card
                key={item.id}
                item={item}
                compact={compact}
                onClick={() => {
                  setDetailItem(item);
                  setDetailOpen(true);
                }}
                onDragStart={(e) => onDragStart(e, item, col.key)}
                onNext={() => {
                  const next = nextStageOf(col.key);
                  if (next !== col.key) doMove(item.id, col.key, next);
                }}
                isLast={col.key === PIPELINE[PIPELINE.length - 1]}
              />
            ))}
          </Column>
        ))}
      </div>

      <DetailModal open={detailOpen} onClose={() => setDetailOpen(false)} item={detailItem} />
    </div>
  );
}

/* ─────────────── Column / Card ─────────────── */
function Column({ title, children, onDrop }) {
  return (
    <div
      className="rounded-2xl bg-base-200 border border-base-300 min-h-[280px] p-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="font-medium mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Card({ item, onDragStart, onNext, isLast, onClick, compact }) {
  const { t } = useTranslation();
  const title = item.nombre || t("common.noData");

  const chips = [
    item.stage && (
      <span key="stage" className={`badge badge-outline ${compact ? "badge-xs" : "badge-sm"}`}>
        {t(`common.stages.${item.stage}`, item.stage)}
      </span>
    ),
    <EstimateChip
      key="est"
      url={item.estimate_url}
      amount={item.estimate_amount}
      currency={item.estimate_currency}
      compact={compact}
    />,
    item.prob_win != null && (
      <span key="prob" className={`badge badge-outline ${compact ? "badge-xs" : "badge-sm"}`}>
        {t("projects.fields.probWin", "Prob. win")}: {item.prob_win}%
      </span>
    ),
    item.fecha_cierre_estimada && (
      <DueBadge
        key="close"
        date={item.fecha_cierre_estimada}
        compact={compact}
        labelOverride={t("projects.fields.closeDate", "Cierre est.")}
      />
    ),
  ].filter(Boolean);

  const visible = compact ? chips.slice(0, 3) : chips;
  const overflow = chips.length - visible.length;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`cursor-pointer active:cursor-grabbing rounded-xl border border-base-300 bg-base-100 p-3 hover:shadow ${
        compact ? "py-2" : "py-3"
      }`}
      title={t("pipeline.help.cardHint")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-medium truncate ${compact ? "text-sm" : ""}`}>{title}</div>
          {item.cliente_id && (
            <div className="text-xs opacity-60 truncate flex items-center gap-1">
              <Building2 size={12} /> ID Cliente: {item.cliente_id}
            </div>
          )}
        </div>
        <button
          className="btn btn-ghost btn-xs"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          disabled={isLast}
          title={isLast ? t("pipeline.help.lastStage") : t("pipeline.help.moveNext")}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {(visible.length > 0 || overflow > 0) && (
        <div className={`flex flex-wrap items-center gap-1.5 mt-2 ${compact ? "-mt-0.5" : ""}`}>
          {visible}
          {overflow > 0 && (
            <div className={`badge badge-ghost ${compact ? "badge-xs" : "badge-sm"}`} title={t("cards.topRecentClients", "Más info")}>
              +{overflow}
            </div>
          )}
        </div>
      )}

      {(item.email || item.telefono) && (
        <div className={`grid grid-cols-2 gap-2 text-xs opacity-70 mt-2 ${compact ? "-mt-0.5" : ""}`}>
          {item.email && (
            <div className="flex items-center gap-1 truncate" title={item.email}>
              <Mail size={12} /> <span className="truncate">{item.email}</span>
            </div>
          )}
          {item.telefono && (
            <div className="flex items-center gap-1 truncate" title={item.telefono}>
              <Phone size={12} /> <span className="truncate">{item.telefono}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
