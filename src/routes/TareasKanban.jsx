// src/routes/TareasKanban.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchTareasKanban, moveTarea } from "../utils/vexKanbanApi";
import { toast } from "react-hot-toast";
import { CalendarClock, ChevronRight, Check, Filter, Search, X } from "lucide-react";

/* ─────────────── Columnas base (keys BE) ─────────────── */
const COLS = [
  { key: "todo"    },
  { key: "doing"   },
  { key: "waiting" },
  { key: "done"    },
];

/* ─────────────── Utils ─────────────── */
function safeDate(v) {
  const d = v ? new Date(v) : null;
  return isNaN(d?.getTime?.() ?? NaN) ? null : d;
}
function sortByDueCreated(items = []) {
  const arr = [...items];
  arr.sort((a, b) => {
    const da = safeDate(a.vence_en)?.getTime?.() ?? Infinity;
    const db = safeDate(b.vence_en)?.getTime?.() ?? Infinity;
    if (da !== db) return da - db;
    const ca = safeDate(a.created_at)?.getTime?.() ?? 0;
    const cb = safeDate(b.created_at)?.getTime?.() ?? 0;
    return cb - ca;
  });
  return arr;
}

/* ─────────────── Estado de query en URL ─────────────── */
function useQueryState() {
  const [state, setState] = useState(() => {
    const u = new URL(window.location.href);
    return {
      q: u.searchParams.get("q") || "",
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

/* ─────────────── Filtro FE ─────────────── */
function applyFiltersFE(list = [], f = {}) {
  const q = (f.q || "").toLowerCase().trim();
  return (list || []).filter((t) => {
    if (q) {
      const hay = [t.titulo, t.cliente_nombre]
        .map((v) => (v || "").toLowerCase())
        .some((v) => v.includes(q));
      if (!hay) return false;
    }
    if (f.only_due && !t.vence_en) return false;
    return true;
  });
}

/* ─────────────── UI helpers ─────────────── */
function DueBadge({ date, compact }) {
  const { t } = useTranslation();
  if (!date) return null;
  const due = new Date(date);
  const mins = (due.getTime() - Date.now()) / 60000;
  let tone = "badge-info";
  let label = t("common.badges.due");
  if (mins < 0) { tone = "badge-error"; label = t("common.badges.overdue"); }
  else if (mins <= 1440) { tone = "badge-warning"; label = t("common.badges.dueToday"); }
  return (
    <span className={`badge ${tone} ${compact ? "badge-xs" : "badge-sm"} badge-outline`}>
      <CalendarClock size={12} className="mr-1" />
      {label}: {due.toLocaleString()}
    </span>
  );
}

function FiltersBar({ value, onChange, onClear, right }) {
  const { t } = useTranslation();
  const [typing, setTyping] = useState(value.q);
  useEffect(() => {
    const tmo = setTimeout(() => onChange({ ...value, q: typing }), 300);
    return () => clearTimeout(tmo);
  }, [typing]); // eslint-disable-line

  return (
    <div className="mb-4 rounded-2xl bg-base-200 border border-base-300 p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-[220px]">
        <Search size={16} className="opacity-70" />
        <input
          className="input input-sm input-bordered w-full"
          placeholder={t("kanbanTasks.filters.placeholder", "Buscar (título o cliente)")}
          value={typing}
          onChange={(e) => setTyping(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="label cursor-pointer gap-2">
          <span className="label-text">{t("pipeline.filters.onlyDue")}</span>
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={value.only_due}
            onChange={(e) => onChange({ ...value, only_due: e.target.checked })}
          />
        </label>

        {(value.q || value.only_due) ? (
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

/* ─────────────── Página ─────────────── */
export default function TareasKanban() {
  const { t } = useTranslation();
  const [filters, setFilters] = useQueryState();

  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);

  // modo compacto persistente
  const [compact, setCompact] = useState(() => {
    try {
      const v = localStorage.getItem("vex_tasks_compact");
      return v == null ? true : v === "1";
    } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem("vex_tasks_compact", compact ? "1" : "0"); } catch {}
  }, [compact]);

  const firstLoadRef = useRef(true);
  const inflightRef = useRef(0);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reload() {
    const reqId = ++inflightRef.current;
    const showSkeleton = firstLoadRef.current || cols.length === 0;
    if (showSkeleton) setLoading(true);

    try {
      const data = await fetchTareasKanban();

      // Normalizo formatos { columns:[...] } o { columns:{...}, order }
      let ordered = [];
      if (Array.isArray(data?.columns)) {
        const byKey = new Map(
          (data.columns || []).map((c) => {
            const key = c.key || c.title;
            const items = sortByDueCreated(c.items || []);
            return [key, { key, title: key, items, count: items.length }];
          })
        );
        const order = data.order?.length
          ? data.order
          : (data.columns || []).map((c) => c.key || c.title);
        ordered = (order.length ? order : COLS.map((c) => c.key)).map(
          (k) => byKey.get(k) || { key: k, title: k, items: [], count: 0 }
        );
      } else {
        const colObj = data?.columns && !Array.isArray(data.columns) ? data.columns : data || {};
        const order = data?.order?.length ? data.order : COLS.map((c) => c.key);
        ordered = order.map((k) => {
          const base = Array.isArray(colObj?.[k]) ? colObj[k] : [];
          const items = sortByDueCreated(base);
          return { key: k, title: k, items, count: items.length };
        });
      }

      ordered.forEach((c) => (c.count = c.items.length));
      if (reqId === inflightRef.current) setCols(ordered);
    } catch (e) {
      console.error(e);
      toast.error(t("kanbanTasks.toasts.loadError"));
    } finally {
      if (reqId === inflightRef.current && (firstLoadRef.current || cols.length === 0)) {
        setLoading(false);
        firstLoadRef.current = false;
      }
    }
  }

  // Filtros FE aplicados a las columnas
  const filteredCols = useMemo(() => {
    return (cols || []).map((c) => {
      const items = applyFiltersFE(c.items, filters);
      return { ...c, items, count: items.length };
    });
  }, [cols, filters]);

  const colMap = useMemo(() => new Map(filteredCols.map((c) => [c.key, c])), [filteredCols]);

  /* ─────────────── DnD ─────────────── */
  function onDragStart(e, item, fromKey) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, fromKey }));
    e.dataTransfer.effectAllowed = "move";
  }
  async function onDrop(e, toKey) {
    e.preventDefault();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (!payload.id || payload.fromKey === toKey) return;
    await doMove(payload.id, payload.fromKey, toKey);
  }
  const nextOf = (key) => {
    const i = COLS.findIndex((c) => c.key === key);
    return COLS[Math.min(i + 1, COLS.length - 1)]?.key || key;
  };

  async function doMove(id, fromKey, toKey) {
    try {
      await moveTarea(id, toKey); // el BE marca completada si es 'done'
      setCols((prev) => {
        const copy = prev.map((c) => ({ ...c, items: [...c.items] }));
        const from = copy.find((c) => c.key === fromKey);
        const to = copy.find((c) => c.key === toKey);
        if (!from || !to) return prev;
        const idx = from.items.findIndex((x) => x.id === id);
        if (idx >= 0) {
          const [it] = from.items.splice(idx, 1);
          it.estado = toKey;
          it.completada = toKey === "done";
          to.items.unshift(it);
          to.items = sortByDueCreated(to.items);
        }
        from.count = from.items.length;
        to.count = to.items.length;
        return copy;
      });
      toast.success(t("kanbanTasks.toasts.moved"));
    } catch {
      toast.error(t("kanbanTasks.toasts.moveError"));
    }
  }

  /* ─────────────── Render ─────────────── */
  const titleOf = (key) => {
    const { t } = useTranslation();
    // mapea usando las traducciones de estados
    return t(`common.taskStates.${key}`, key);
  };

  if (loading) {
    return (
      <div className="p-3">
        <h1 className="text-2xl font-semibold mb-4">{t("kanbanTasks.title")}</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, k) => (
            <div key={k} className="rounded-2xl bg-base-200 border border-base-300 min-h-[280px] p-3">
              <div className="skeleton h-6 w-32 mb-2" />
              <div className="skeleton h-16 w-full mb-2" />
              <div className="skeleton h-16 w-full mb-2" />
              <div className="skeleton h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("kanbanTasks.title")}</h1>
        <label className="label cursor-pointer gap-2">
          <span className="text-sm opacity-80">Compacto</span>
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
        onClear={() => setFilters({ q: "", only_due: false })}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {COLS.map((col) => (
          <Column
            key={col.key}
            title={`${titleOf(col.key)} ${colMap.get(col.key)?.count ? `(${colMap.get(col.key).count})` : ""}`}
            onDrop={(e) => onDrop(e, col.key)}
          >
            {(colMap.get(col.key)?.items || []).map((item) => (
              <TaskCard
                key={item.id}
                item={item}
                compact={compact}
                onDragStart={(e) => onDragStart(e, item, col.key)}
                onNext={() => {
                  const next = nextOf(col.key);
                  if (next !== col.key) doMove(item.id, col.key, next);
                }}
                onDone={() => {
                  if (col.key !== "done") doMove(item.id, col.key, "done");
                }}
                isLast={col.key === "done"}
              />
            ))}
          </Column>
        ))}
      </div>
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

function TaskCard({ item, compact, onDragStart, onNext, onDone, isLast }) {
  const { t } = useTranslation();
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`cursor-grab active:cursor-grabbing rounded-xl border border-base-300 bg-base-100 p-3 hover:shadow ${compact ? "py-2" : "py-3"}`}
      title={t("kanbanTasks.help.drag")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-medium truncate ${compact ? "text-sm" : ""}`}>{item.titulo}</div>
          <div className="text-xs opacity-60 truncate">{item.cliente_nombre || "—"}</div>
        </div>
        <div className="flex items-center gap-1">
          {!isLast && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              title={t("kanbanTasks.help.nextCol")}
            >
              <ChevronRight size={14} />
            </button>
          )}
          {item.estado !== "done" && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={(e) => { e.stopPropagation(); onDone(); }}
              title={t("kanbanTasks.help.markDone")}
            >
              <Check size={14} />
            </button>
          )}
        </div>
      </div>

      <div className={`mt-2 ${compact ? "-mt-0.5" : ""}`}>
        <DueBadge date={item.vence_en} compact={compact} />
      </div>
    </div>
  );
}
