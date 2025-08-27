// components/KpiBar.jsx
import { useEffect, useState } from "react";
import { fetchKpis } from "../utils/vexKanbanApi";
import { toast } from "react-hot-toast";

export default function KpiBar() {
  const [kpi, setKpi] = useState(null);
  useEffect(() => {
    fetchKpis().then(setKpi).catch(() => toast.error("No pude cargar KPIs"));
  }, []);

  if (!kpi) return null;

  const won = kpi.tareasPorEstado?.find(x => x.estado === "done")?.total ?? 0;
  const lost = kpi.clientesPorCat?.find(x => x.categoria === "Lost")?.total ?? 0;
  const totalDeals = won + lost;
  const winRate = totalDeals ? Math.round((won / totalDeals) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Card label="Won" value={won} />
      <Card label="Lost" value={lost} />
      <Card label="Win rate" value={`${winRate}%`} />
      <Card label="Próx. 7 días" value={kpi.proximos7d ?? 0} />
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
