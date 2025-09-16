// src/routes/ClientesKanban.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchClientesKanban, moveCliente } from "../utils/vexKanbanApi";
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

const PIPELINE = ["Incoming Leads", "Qualified", "Bid/Estimate Sent", "Won", "Lost"];

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
      const hay =
        [c.nombre, c.empresa, c.email, c.telefono]
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
      } else if (asg.toLowerCase() !== f.assignee.toLowerCase()) {
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
function DueBadge({ date }) {
  if (!date) return <span className="badge badge-ghost">Sin due</span>;
  const due = new Date(date);
  const mins = (due.getTime() - Date.now()) / 60000;
  let tone = "badge-info";
  let label = "Vence";
  if (mins < 0) {
    tone = "badge-error";
    label = "Vencido";
  } else if (mins <= 60 * 24) {
    tone = "badge-warning";
    label = "Vence hoy";
  }
  return (
    <span className={`badge ${tone} badge-outline`}>
      <CalendarClock size={12} className="mr-1" />
      {label}: {due.toLocaleString()}
    </span>
  );
}

function EstimateChip({ url }) {
  if (!url) return <span className="badge badge-ghost">Sin estimate</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="badge badge-primary badge-outline no-underline"
      title="Ver estimate"
    >
      <Paperclip size={12} className="mr-1" />
      Estimate
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

function FiltersBar({ value, onChange, onClear }) {
  const [typing, setTyping] = useState(value.q);
  useEffect(() => {
    const t = setTimeout(() => onChange({ ...value, q: typing }), 350);
    return () => clearTimeout(t);
  }, [typing]);

  return (
    <div className="mb-4 rounded-2xl bg-base-200 border border-base-300 p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-[220px]">
        <Search size={16} className="opacity-70" />
        <input
          className="input input-sm input-bordered w-full"
          placeholder="Buscar (nombre, email, teléfono, empresa)"
          value={typing}
          onChange={(e) => setTyping(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <select
          className="select select-sm select-bordered"
          value={value.source}
          onChange={(e) => onChange({ ...value, source: e.target.value })}
        >
          <option value="">Source: todos</option>
          <option>Outreach</option>
          <option>Blue Book ITB</option>
          <option>Inbound</option>
          <option>Referral</option>
        </select>

        <select
          className="select select-sm select-bordered"
          value={value.assignee}
          onChange={(e) => onChange({ ...value, assignee: e.target.value })}
        >
          <option value="">Assignee: todos</option>
          <option>Sin asignar</option>
          <option>Mauricio</option>
          <option>Melisa</option>
          {/* agrega tus usuarios reales si corresponde */}
        </select>

        <label className="label cursor-pointer gap-2">
          <span className="label-text">Solo con follow-up</span>
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={value.only_due}
            onChange={(e) => onChange({ ...value, only_due: e.target.checked })}
          />
        </label>

        {(value.q || value.source || value.assignee || value.only_due) ? (
          <button className="btn btn-sm" onClick={onClear}>
            <X size={16} /> Limpiar
          </button>
        ) : (
          <div className="btn btn-sm btn-ghost no-animation">
            <Filter size={16} /> Filtros
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Detalle (panel modal) ─────────────── */
function DetailModal({ open, onClose, item }) {
  if (!open || !item) return null;
  const assignee = item.assignee_email || item.assignee || "Sin asignar";
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-base-100 shadow-xl border border-base-300 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">
              {item.nombre || item.empresa || item.email || "Sin nombre"}
            </h3>
            {item.empresa && <div className="text-sm opacity-70 truncate flex items-center gap-1">
              <Building2 size={14} /> {item.empresa}
            </div>}
          </div>
          <button className="btn btn-sm" onClick={onClose}><X size={16} /> Cerrar</button>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-base-200 p-3">
            <div className="text-sm font-medium mb-2">Contacto</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Mail size={14}/> {item.email || "—"}</div>
              <div className="flex items-center gap-2"><Phone size={14}/> {item.telefono || "—"}</div>
              <div className="flex items-center gap-2"><UserCircle2 size={14}/> {assignee}</div>
            </div>
          </div>

          <div className="rounded-xl bg-base-200 p-3">
            <div className="text-sm font-medium mb-2">Seguimiento</div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="badge badge-outline"><Tag size={12} className="mr-1"/>Source: {item.source || "—"}</span>
              <DueBadge date={item.due_date} />
              <EstimateChip url={item.estimate_url} />
              {item.stage && <span className="badge badge-outline">{item.stage}</span>}
            </div>
            {item.notas && (
              <div className="mt-3">
                <div className="text-xs opacity-60 mb-1">Notas</div>
                <div className="rounded-lg bg-base-100 p-2 border border-base-300 text-sm whitespace-pre-wrap">
                  {item.notas}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs opacity-60 flex items-center gap-3">
          <Clock3 size={12}/> Creado: {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Página principal ─────────────── */
export default function ClientesKanban() {
  const [filters, setFilters] = useQueryState();
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const colMap = useMemo(() => new Map(cols.map((c) => [c.key, c])), [cols]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

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

      // 1) columnas del kanban
      const data = await fetchClientesKanban(beParams);
      if (myReq !== inflightRef.current) return;

      // 2) enriquecemos con detalles de /clientes (con fallback FE si el BE devuelve 500)
      let fullList = [];
      try {
        const res = await api.get(`/clientes${qs(beParams)}`);
        fullList = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        // Fallback: traigo todos y filtro en FE
        const res = await api.get(`/clientes`);
        const all = Array.isArray(res.data) ? res.data : [];
        fullList = applyFiltersFE(all, beParams);
      }
      if (myReq !== inflightRef.current) return;

      const byId = new Map(fullList.map((c) => [c.id, c]));

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
          const items = sortByDueCreated(
            base.map((i) => ({ ...i, ...(byId.get(i.id) || {}) }))
          );
          return { key: k, title: k, items, count: items.length };
        });
      }

      ordered.forEach((c) => (c.count = c.items.length));
      if (myReq === inflightRef.current) setCols(ordered);
    } catch (e) {
      console.error(e);
      toast.error("No pude cargar el Kanban de clientes");
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
      await moveCliente(id, toKey);
      setCols((prev) => {
        const copy = prev.map((c) => ({ ...c, items: [...c.items] }));
        const from = copy.find((c) => c.key === fromKey);
        const to = copy.find((c) => c.key === toKey);
        if (!from || !to) return prev;
        const idx = from.items.findIndex((x) => x.id === id);
        if (idx >= 0) {
          const [itm] = from.items.splice(idx, 1);
          itm.categoria = toKey;
          to.items.unshift(itm);
          to.items = sortByDueCreated(to.items);
        }
        from.count = from.items.length;
        to.count = to.items.length;
        return copy;
      });
      toast.success(`Movido a ${toKey}`);
    } catch {
      toast.error("No pude mover el cliente");
    }
  }

  if (loading)
    return (
      <div className="p-4">
        <div className="skeleton h-9 w-56 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
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

  return (
    <div className="p-3">
      <h1 className="text-2xl font-semibold mb-3">Pipeline — Clientes</h1>

      <FiltersBar
        value={filters}
        onChange={setFilters}
        onClear={() => setFilters({ q: "", source: "", assignee: "", only_due: false })}
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {cols.map((col) => (
          <Column key={col.key} title={`${col.title} ${col.count ? `(${col.count})` : ""}`} onDrop={(e) => onDrop(e, col.key)}>
            {col.items.map((item) => (
              <Card
                key={item.id}
                item={item}
                onClick={() => { setDetailItem(item); setDetailOpen(true); }}
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

      <DetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        item={detailItem}
      />
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

function Card({ item, onDragStart, onNext, isLast, onClick }) {
  const assignee = item.assignee_email || item.assignee || null;
  const title = item.nombre || item.empresa || item.email || "Sin nombre";
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-pointer active:cursor-grabbing rounded-xl border border-base-300 bg-base-100 p-3 hover:shadow"
      title="Click para ver detalle. Arrastrá para mover de etapa."
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium truncate">{title}</div>
          {item.empresa && item.nombre && (
            <div className="text-xs opacity-60 truncate">{item.empresa}</div>
          )}
        </div>
        <button
          className="btn btn-ghost btn-xs"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          disabled={isLast}
          title={isLast ? "Última etapa" : "Mover a la siguiente etapa"}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Chips clave */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <span className="badge badge-outline">Source: {item.source || "—"}</span>
        <span className="badge badge-outline">
          <UserCircle2 size={12} className="mr-1" />
          {assignee || "Sin asignar"}
        </span>
        <DueBadge date={item.due_date} />
        <EstimateChip url={item.estimate_url} />
      </div>

      {/* Contacto */}
      <div className="grid grid-cols-2 gap-2 text-xs opacity-70 mt-2">
        <div className="flex items-center gap-1 truncate">
          <Mail size={12} /> <span className="truncate">{item.email || "—"}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <Phone size={12} /> <span className="truncate">{item.telefono || "—"}</span>
        </div>
      </div>
    </div>
  );
}
