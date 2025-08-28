// src/routes/TareasKanban.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchTareasKanban, moveTarea } from "../utils/vexKanbanApi";
import { toast } from "react-hot-toast";
import { CalendarClock, ChevronRight, Check } from "lucide-react";

const COLS = [
  { key: "todo",    title: "Por hacer" },
  { key: "doing",   title: "En curso" },
  { key: "waiting", title: "En espera" },
  { key: "done",    title: "Hecho" },
];

function DueBadge({ date }) {
  if (!date) return <span className="badge badge-ghost">Sin due</span>;
  const due = new Date(date);
  const mins = (due.getTime() - Date.now()) / 60000;
  let tone = "badge-info";
  let label = "Vence";
  if (mins < 0)      { tone = "badge-error";   label = "Vencido"; }
  else if (mins <= 1440) { tone = "badge-warning"; label = "Vence hoy"; }
  return (
    <span className={`badge ${tone} badge-outline`}>
      <CalendarClock size={12} className="mr-1" />
      {label}: {due.toLocaleString()}
    </span>
  );
}

export default function TareasKanban() {
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);

  const colMap = useMemo(() => new Map(cols.map(c => [c.key, c])), [cols]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { columns } = await fetchTareasKanban();
        // normalizamos al orden fijo y aseguramos count
        const byKey = new Map((columns || []).map(c => [c.key, c]));
        const ordered = COLS.map(({ key, title }) => {
          const c = byKey.get(key) || { key, title, items: [] };
          return { key, title, items: c.items || [], count: (c.items || []).length };
        });
        setCols(ordered);
      } catch {
        toast.error("No pude cargar el Kanban de tareas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function onDragStart(e, item, fromKey) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, fromKey }));
    e.dataTransfer.effectAllowed = "move";
  }

  async function onDrop(e, toKey) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (!data.id || data.fromKey === toKey) return;
    await doMove(data.id, data.fromKey, toKey);
  }

  const nextOf = (key) => {
    const i = COLS.findIndex(c => c.key === key);
    return COLS[Math.min(i + 1, COLS.length - 1)]?.key || key;
  };

  async function doMove(id, fromKey, toKey) {
    try {
      await moveTarea(id, toKey); // backend asigna completada/orden
      setCols(prev => {
        const copy = prev.map(c => ({ ...c, items: [...c.items] }));
        const from = copy.find(c => c.key === fromKey);
        const to   = copy.find(c => c.key === toKey);
        if (!from || !to) return prev;
        const i = from.items.findIndex(x => x.id === id);
        if (i >= 0) {
          const [it] = from.items.splice(i, 1);
          it.estado = toKey;
          it.completada = toKey === "done";
          to.items.unshift(it);
        }
        from.count = from.items.length;
        to.count = to.items.length;
        return copy;
      });
      toast.success("Tarea movida");
    } catch {
      toast.error("No pude mover la tarea");
    }
  }

  if (loading) {
    return (
      <div className="p-3">
        <h1 className="text-2xl font-semibold mb-4">Kanban — Tareas</h1>
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
      <h1 className="text-2xl font-semibold mb-4">Kanban — Tareas</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {COLS.map(col => (
          <Column
            key={col.key}
            title={`${col.title} ${colMap.get(col.key)?.count ? `(${colMap.get(col.key).count})` : ""}`}
            onDrop={(e) => onDrop(e, col.key)}
          >
            {(colMap.get(col.key)?.items || []).map(item => (
              <TaskCard
                key={item.id}
                item={item}
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

function TaskCard({ item, onDragStart, onNext, onDone, isLast }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing rounded-xl border border-base-300 bg-base-100 p-3"
      title="Arrastrá para mover de columna"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium truncate">{item.titulo}</div>
          <div className="text-xs opacity-60 truncate">{item.cliente_nombre || "—"}</div>
        </div>
        <div className="flex items-center gap-1">
          {!isLast && (
            <button className="btn btn-ghost btn-xs" onClick={onNext} title="Mover a la siguiente columna">
              <ChevronRight size={14} />
            </button>
          )}
          {item.estado !== "done" && (
            <button className="btn btn-ghost btn-xs" onClick={onDone} title="Marcar como hecho">
              <Check size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2">
        <DueBadge date={item.vence_en} />
      </div>
    </div>
  );
}
