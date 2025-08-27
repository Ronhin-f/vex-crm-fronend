// routes/ClientesKanban.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchClientesKanban, moveCliente } from "../utils/vexKanbanApi";
import { toast } from "react-hot-toast";

const PIPELINE = ["Incoming Leads", "Qualified", "Bid/Estimate Sent", "Won", "Lost"];

export default function ClientesKanban() {
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const colMap = useMemo(() => new Map(cols.map(c => [c.key, c])), [cols]);

  useEffect(() => {
    reload();
  }, []);

  async function reload() {
    try {
      setLoading(true);
      const data = await fetchClientesKanban();
      // normalizo al orden fijo del pipeline
      const byKey = new Map(data.columns.map(c => [c.key, c]));
      const ordered = PIPELINE.map(k => byKey.get(k) || { key: k, title: k, count: 0, items: [] });
      setCols(ordered);
    } catch {
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

    try {
      await moveCliente(payload.id, toKey);
      // actualizo localmente sin re-fetch
      setCols(prev => {
        const copy = prev.map(c => ({ ...c, items: [...c.items] }));
        const from = copy.find(c => c.key === payload.fromKey);
        const to = copy.find(c => c.key === toKey);
        const idx = from.items.findIndex(x => x.id === payload.id);
        if (idx >= 0) {
          const [itm] = from.items.splice(idx, 1);
          itm.categoria = toKey;
          to.items.unshift(itm);
        }
        from.count = from.items.length;
        to.count = to.items.length;
        return copy;
      });
      toast.success("Cliente movido");
    } catch {
      toast.error("No pude mover el cliente");
    }
  }

  if (loading) return <div className="p-4">Cargando…</div>;

  return (
    <div className="p-3">
      <h1 className="text-2xl font-semibold mb-4">Pipeline — Clientes</h1>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {cols.map(col => (
          <Column
            key={col.key}
            title={`${col.title} ${col.count ? `(${col.count})` : ""}`}
            onDrop={(e) => onDrop(e, col.key)}
          >
            {col.items.map(item => (
              <Card key={item.id} item={item} onDragStart={(e) => onDragStart(e, item, col.key)} />
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

function Card({ item, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing rounded-xl border border-base-300 bg-base-100 p-3"
      title={`Arrastrá para mover de etapa`}
    >
      <div className="font-medium">{item.nombre}</div>
      <div className="text-sm opacity-70">{item.email || "—"}</div>
      <div className="text-xs opacity-60">{item.telefono || "—"}</div>
    </div>
  );
}
