// components/KpiBar.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { fetchKpis } from "../utils/vexKanbanApi";
import { toast } from "react-hot-toast";

export default function KpiBar() {
  const [state, setState] = useState({ won: 0, lost: 0, winRate: 0, due7: 0 });

  useEffect(() => {
    (async () => {
      try {
        // 1) Preferimos KPIs consolidados (pipeline en PROYECTOS)
        const { data } = await api.get("/analytics/kpis");
        const won = data?.pipeline?.summary?.won ?? 0;
        const lost = data?.pipeline?.summary?.lost ?? 0;
        const winRate =
          data?.pipeline?.summary?.win_rate ??
          (won + lost > 0 ? Math.round((won * 100) / (won + lost)) : 0);
        const due7 = data?.tasks?.due_next_7d ?? 0;
        setState({ won, lost, winRate, due7 });
      } catch {
        // 2) Fallback a /kanban/kpis (compat)
        try {
          const k = await fetchKpis();
          const won =
            // proyectos por stage (si el backend nuevo los expone)
            k?.proyectosPorStage?.find?.((x) => x.stage === "Won")?.total ??
            // clientes por stage (legacy)
            k?.clientesPorStage?.find?.((x) => x.stage === "Won")?.total ??
            // clientes por categoría (más legacy)
            k?.clientesPorCat?.find?.((x) => x.categoria === "Won")?.total ??
            0;
          const lost =
            k?.proyectosPorStage?.find?.((x) => x.stage === "Lost")?.total ??
            k?.clientesPorStage?.find?.((x) => x.stage === "Lost")?.total ??
            k?.clientesPorCat?.find?.((x) => x.categoria === "Lost")?.total ??
            0;
          const winRate = won + lost > 0 ? Math.round((won * 100) / (won + lost)) : 0;
          const due7 = k?.proximos7d ?? k?.proximos_7d ?? 0;
          setState({ won, lost, winRate, due7 });
        } catch {
          toast.error("No pude cargar KPIs");
        }
      }
    })();
  }, []);

  const { won, lost, winRate, due7 } = state;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Card label="Won" value={won} />
      <Card label="Lost" value={lost} />
      <Card label="Win rate" value={`${winRate}%`} />
      <Card label="Próx. 7 días" value={due7} />
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-200 p-4">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
