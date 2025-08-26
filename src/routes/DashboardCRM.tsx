import { useEffect, useState, type ReactNode } from "react";
import { Users, ClipboardList, BellRing } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

type Cliente = {
  id: number;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  created_at?: string | null;
};

type Seguimiento = {
  id: number;
  titulo: string;
  vence_en: string;
  cliente_id?: number | null;
  cliente_nombre?: string | null;
};

export default function DashboardCRM() {
  const { usuario } = useAuth();

  // 👇 antes tenías un "const { loading }: boolean" huérfano. Lo removimos.
  const [isLoading, setIsLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    total_clientes: 0,
    total_tareas: 0,
    proximos_7d: 0,
  });
  const [top, setTop] = useState<Cliente[]>([]);
  const [seg, setSeg] = useState<Seguimiento[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/dashboard");
        if (!mounted) return;
        setMetrics(
          data?.metrics ?? {
            total_clientes: 0,
            total_tareas: 0,
            proximos_7d: 0,
          }
        );
        setTop(data?.topClientes ?? []);
        setSeg(data?.proximosSeguimientos ?? []);
      } catch (e) {
        console.error("Dashboard error", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto text-sm text-gray-600">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-1">📊 Vex CRM — Dashboard</h1>
        <p className="text-sm text-gray-600 mb-6">
          Hola, <b>{usuario?.email}</b>
        </p>

        {/* métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Metric
            icon={<Users size={18} />}
            label="Clientes"
            value={metrics.total_clientes}
          />
          <Metric
            icon={<ClipboardList size={18} />}
            label="Tareas"
            value={metrics.total_tareas}
          />
          <Metric
            icon={<BellRing size={18} />}
            label="Seguimientos (7 días)"
            value={metrics.proximos_7d}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* top clientes */}
          <Card title="🆕 Top clientes recientes">
            <ul className="divide-y">
              {top.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="font-medium">{c.nombre}</div>
                  <div className="text-xs text-gray-500">
                    {c.email || "—"} • {c.telefono || "—"}
                  </div>
                </li>
              ))}
              {top.length === 0 && (
                <li className="py-3 text-sm text-gray-500">
                  No hay clientes recientes.
                </li>
              )}
            </ul>
          </Card>

          {/* próximos seguimientos */}
          <Card title="⏰ Próximos 7 días">
            <ul className="divide-y">
              {seg.map((s) => (
                <li key={s.id} className="py-3">
                  <div className="font-medium">{s.titulo}</div>
                  <div className="text-xs text-gray-500">
                    {s.cliente_nombre || "—"} • Vence:{" "}
                    {new Date(s.vence_en).toLocaleString()}
                  </div>
                </li>
              ))}
              {seg.length === 0 && (
                <li className="py-3 text-sm text-gray-500">
                  Sin seguimientos próximos.
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-gray-600 text-sm mb-1 flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}
