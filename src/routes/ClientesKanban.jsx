// src/routes/ClientesKanban.jsx
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

const PIPELINE = ["Incoming Leads", "Qualified", "Bid/Estimate Sent", "Won", "Lost"];

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

export default function ClientesKanban() {
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const colMap = useMemo(() => new Map(cols.map((c) => [c.key, c])), [cols]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reload() {
    try {
      setLoading(true);
      // 1) columnas del kanban
      const data = await fetchClientesKanban();
      // 2) enriquecemos con detalles de /clientes (source, assignee, due, estimate, contacto)
      const { data: fullList = [] } = await api.get("/clientes");
      const byId = new Map(Array.isArray(fullList) ? fullList.map((c) => [c.id, c]) : []);
      const byKey = new Map(
        (data.columns || []).map((c) => [
          c.key,
          {
            ...c,
            items: (c.items || []).map((i) => ({ ...i, ...(byId.get(i.id) || {}) })),
          },
        ])
      );
      const ordered = PIPELINE.map(
        (k) => byKey.get(k) || { key: k, title: k, count: 0, items: [] }
      );
      // aseguramos count correcto
      ordered.forEach((c) => (c.count = c.items.length));
      setCols(ordered);
    } catch (e) {
      console.error(e);
      toast.error("No pude cargar el Kanban de clientes");
    } finally {
      setLoading(false);
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
      // actualizamos local sin re-fetch
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
      <h1 className="text-2xl font-semibold mb-4">Pipeline — Clientes</h1>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {cols.map((col) => (
          <Column key={col.key} title={`${col.title} ${col.count ? `(${col.count})` : ""}`} onDrop={(e) => onDrop(e, col.key)}>
            {col.items.map((item) => (
              <Card
                key={item.id}
                item={item}
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
    </div>
  );
}

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

function Card({ item, onDragStart, onNext, isLast }) {
  const assignee = item.assignee_email || item.assignee || null;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing rounded-xl border border-base-300 bg-base-100 p-3"
      title="Arrastrá para mover de etapa"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium truncate">{item.nombre}</div>
          <div className="text-xs opacity-60 truncate">{item.email || "—"}</div>
        </div>
        <button
          className="btn btn-ghost btn-xs"
          onClick={onNext}
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
