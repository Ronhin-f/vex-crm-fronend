// frontend/src/routes/ProyectosKanban.jsx
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
  Filter,
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
function sortByDueCreated(items = []) {
  const arr = [...items];
  arr.sort((a, b) => {
    const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
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

/** Filtro FE cuando el BE no banca filtros */
function applyFiltersFE(list = [], f = {}) {
  const q = (f.q || "").toLowerCase().trim();
  return (list || []).filter((c) => {
    if (q) {
      const hay = [c.nombre, c.empresa, c.email, c.telefono]
        .map((v) => (v || "").toLowerCase())
        .some((v) => v.includes(q));
      if (!hay) return false;
    }
    if (f.source) {
      if ((c.source || "") !== f.source) return false;
    }
    if (f.assignee) {
      const asg = (c.assignee_email || c.assignee || "").trim();
      if (f.assignee === "Sin asignar") {
        if (asg) return false;
      } else if ((asg || "").toLowerCase() !== f.assignee.toLowerCase()) {
        return false;
      }
    }
    if (f.only_due) {
      const duev = c.due_date || c.next_follow_up;
      if (!duev) return false;
    }
    return true;
  });
}

/* ─────────────── Badges ─────────────── */
function DueBadge({ date, compact }) {
  const { t } = useTranslation();
  if (!date) return null;
  const due = new Date(date);
  const mins = (due.getTime() - Date.now()) / 60000;
  let tone = "badge-info";
  let label = t("common.badges.due");
  if (mins < 0) {
    tone = "badge-error";
    label = t("common.badges.overdue");
  } else if (mins <= 60 * 24) {
    tone = "badge-warning";
    label = t("common.badges.dueToday");
  }
  return (
    <span className={`badge ${tone} ${compact ? "badge-xs" : "badge-sm"} badge-outline`}>
      <CalendarClock size={12} className="mr-1" />
      {label}: {due.toLocaleString()}
    </span>
  );
}

function EstimateChip({ url, compact }) {
  const { t } = useTranslation();
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`badge badge-primary ${compact ? "badge-xs" : "badge-sm"} badge-outline no-underline`}
      title={t("clients.list.viewEstimate")}
      onClick={(e) => e.stopPropagation()}
    >
      <Paperclip size={12} className="mr-1" />
      {t("common.badges.estimate")}
    </a>
  );
}

/* ─────────────── Filtros con persistencia en URL ─────────────── */
function useQueryState() {
  const [state, setState] = useState(() => {
    const u = new URL(window.location.href);
    return {
      q: u.searchParams.get("q") || "",
      source: u.searchParams.get("source") || "",
      assignee: u.searchParams.get("assignee") || "",
      only_due: u.searchParams.get("only_due") === "1",
    };
  });

  useEffect(() => {
    const current = new URL(window.location.href);
    const next = new URL(window.location.href);
    Object.entries(state).forEach(([k, v]) => {
      if (!v || (k === "only_due" && !v)) next.searchParams.delete(k);
      else next.searchParams.set(k, k === "only_due" ? "1" : String(v));
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
          value={value.source}
          onChange={(e) => onChange({ ...value, source: e.target.value })}
        >
          <option value="">{t("pipeline.filters.sourceAll")}</option>
          {/* sources conocidos; si llega otro, se verá crudo */}
          <option>Outreach</option>
          <option>Blue Book ITB</option>
          <option>Inbound</option>
          <option>Referral</option>
          <option>Building Connected</option>
          <option>Gmail</option>
        </select>

        <select
          className="select select-sm select-bordered"
          value={value.assignee}
          onChange={(e) => onChange({ ...value, assignee: e.target.value })}
        >
          <option value="">{t("pipeline.filters.assigneeAll")}</option>
          <option>{t("common.unassigned")}</option>
          {/* agrega tus usuarios reales si corresponde */}
        </select>

        <label className="label cursor-pointer gap-2">
          <span className="label-text">{t("pipeline.filters.onlyDue")}</span>
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={value.only_due}
            onChange={(e) => onChange({ ...value, only_due: e.target.checked })}
          />
        </label>

        {value.q || value.source || value.assignee || value.only_due ? (
          <button className="btn btn-sm" onClick={onClear}>
            <X size={16} /> {t("actions.clear")}
          </button>
        ) : (
          <div className="btn btn-sm btn-ghost no-animation">
            <Filter size={16} /> {t("pipeline.filters.title")}
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
  const assignee = item.assignee_email || item.assignee || t("common.unassigned");
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
              {item.nombre || item.email || t("common.noData")}
            </h3>
            {item.empresa && (
              <div className="text-sm opacity-70 truncate flex items-center gap-1">
                <Building2 size={14} /> {item.empresa}
              </div>
            )}
          </div>
          <button className="btn btn-sm" onClick={onClose}>
            <X size={16} /> {t("actions.close")}
          </button>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-base-200 p-3">
            <div className="text-sm font-medium mb-2">{t("pipeline.modals.contact")}</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={14} /> {item.email || "—"}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} /> {item.telefono || "—"}
              </div>
              <div className="flex items-center gap-2">
                <UserCircle2 size={14} /> {assignee}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-base-200 p-3">
            <div className="text-sm font-medium mb-2">{t("pipeline.modals.tracking")}</div>
            <div className="flex flex-wrap gap-2 items-center">
              {item.source && (
                <span className="badge badge-outline">
                  <Tag size={12} className="mr-1" />
                  {t(`common.sources.${item.source}`, item.source)}
                </span>
              )}
              <DueBadge date={item.due_date} />
              <EstimateChip url={item.estimate_url} />
              {item.stage && <span className="badge badge-outline">{stageLabel(item.stage)}</span>}
            </div>
            {item.notas && (
              <div className="mt-3">
                <div className="text-xs opacity-60 mb-1">{t("common.notes")}</div>
                <div className="rounded-lg bg-base-100 p-2 border border-base-300 text-sm whitespace-pre-wrap">
                  {item.notas}
                </div>
              </div>
            )}
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
        source: filters.source || undefined,
        assignee: filters.assignee || undefined,
        only_due: filters.only_due ? 1 : undefined,
      };

      // 1) columnas del kanban (PROYECTOS)
      const data = await fetchProyectosKanban(beParams);
      if (myReq !== inflightRef.current) return;

      // 2) enriquecer con /clientes para completar email/teléfono/empresa
      let fullClients = [];
      try {
        const res = await api.get(`/clientes`);
        fullClients = Array.isArray(res.data) ? res.data : [];
      } catch {
        fullClients = [];
      }
      const byClientId = new Map(fullClients.map((c) => [c.id, c]));

      let ordered = [];
      if (Array.isArray(data?.columns)) {
        const byKey = new Map(
          (data.columns || []).map((c) => {
            const key = c.key || c.title;
            const items = sortByDueCreated(
              (c.items || []).map((i) => {
                const cli = byClientId.get(i.cliente_id);
                return {
                  ...i,
                  email: i.email || cli?.email || null,
                  telefono: i.telefono || cli?.telefono || null,
                  empresa: i.empresa || cli?.nombre || null,
                };
              })
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
          const items = sortByDueCreated(
            base.map((i) => {
              const cli = byClientId.get(i.cliente_id);
              return {
                ...i,
                email: i.email || cli?.email || null,
                telefono: i.telefono || cli?.telefono || null,
                empresa: i.empresa || cli?.nombre || null,
              };
            })
          );
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
        <h1 className="text-2xl font-semibold">{t("pipeline.titleProjects", "Pipeline — Proyectos")}</h1>
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
        onClear={() => setFilters({ q: "", source: "", assignee: "", only_due: false })}
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
  const assignee = item.assignee_email || item.assignee || null;
  const title = item.nombre || item.email || t("common.noData");

  const chips = [
    item.source && (
      <span key="src" className={`badge badge-outline ${compact ? "badge-xs" : "badge-sm"}`}>
        {t(`common.sources.${item.source}`, item.source)}
      </span>
    ),
    assignee && (
      <span key="asg" className={`badge badge-outline ${compact ? "badge-xs" : "badge-sm"}`}>
        <UserCircle2 size={12} className="mr-1" />
        {(assignee.split?.("@")[0] || assignee)}
      </span>
    ),
    item.due_date && <DueBadge key="due" date={item.due_date} compact={compact} />,
    item.estimate_url && <EstimateChip key="est" url={item.estimate_url} compact={compact} />,
  ].filter(Boolean);

  const visible = compact ? chips.slice(0, 2) : chips;
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
          {item.empresa && item.nombre && (
            <div className="text-xs opacity-60 truncate flex items-center gap-1">
              <Building2 size={12} /> {item.empresa}
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
            <div className={`badge badge-ghost ${compact ? "badge-xs" : "badge-sm"}`} title="Más info">
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
