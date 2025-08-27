// routes/TareasKanban.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchTareasKanban, moveTarea } from "../utils/vexKanbanApi";
import { toast } from "react-hot-toast";

const COLS = [
  { key: "todo", title: "Por hacer" },
  { key: "doing", title: "En curso" },
  { key: "waiting", title: "En espera" },
  { key: "done", title: "Hecho" },
];

export default function TareasKanban() {
  const [cols, setCols] = useState([]);
  const colMap = useMemo(() => new Map(cols.map(c => [c.key, c])), [cols]);

  useEffect(() => {
    fetchTareasKanban()
      .then(({ columns }) => setCols(columns))
      .catch(() => toast.error("No pude cargar el Kanban de tareas"));
  }, []);

  function onDragStart(e, item, fromKey) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, fromKey }));
    e.dataTransfer.effectAllowed = "move";
  }
  async function onDrop(e, toKey) {
    e.preventDefault();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (!payload.id) return;
    if (payload.fromKey === toKey) return;

    try {
      await moveTarea(payload.id, toKey);
      setCols(prev => {
        const copy = prev.map(c => ({ ...c, items: [...c.items] }));
        const from = copy.find(c => c.key === payload.fromKey);
        const to = copy.find(c => c.key === toKey);
        const idx = from.items.findIndex(x => x.id === payload.id);
        if (idx >= 0) {
          const [itm] = from.items.splice(idx, 1);
          itm.estado = toKey;
          itm.completada = toKey === "done";
          to.items.unshift(itm);
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
              <TaskCard key={item.id} item={item} onDragStart={(e) => onDragStart(e, item, col.key)} />
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

function TaskCard({ item, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing rounded-xl border border-base-300 bg-base-100 p-3"
      title="Arrastrá para mover de columna"
    >
      <div className="font-medium">{item.titulo}</div>
      <div className="text-sm opacity-70">{item.cliente_nombre || "—"}</div>
      <div className="text-xs opacity-60">{item.vence_en ? new Date(item.vence_en).toLocaleString() : "sin vencimiento"}</div>
    </div>
  );
}
