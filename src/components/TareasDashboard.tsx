// Frontend/src/components/TareasDashboard.tsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

type Cliente = { id: number; nombre: string; };
type Tarea = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  completada: boolean;
  cliente_id?: number | null;
  cliente_nombre?: string | null;
  vence_en?: string | null;
};

export default function TareasDashboard() {
  const { token } = useAuth();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nueva, setNueva] = useState<{ titulo: string; descripcion?: string; cliente_id?: number | ""; vence_en?: string; }>({ titulo: "" });
  const [filtroTexto, setFiltroTexto] = useState("");

  const cargar = async () => {
    const [t, c] = await Promise.all([api.get("/tareas"), api.get("/clientes")]);
    setTareas(t.data || []);
    setClientes(c.data || []);
  };

  useEffect(() => { if (token) cargar().catch(console.error); }, [token]);

  const agregar = async () => {
    if (!nueva.titulo.trim()) { toast.error("Título requerido"); return; }
    try {
      await api.post("/tareas", {
        titulo: nueva.titulo,
        descripcion: nueva.descripcion || null,
        cliente_id: nueva.cliente_id === "" ? null : nueva.cliente_id,
        vence_en: nueva.vence_en || null,
      });
      setNueva({ titulo: "" });
      toast.success("Tarea creada");
      await cargar();
    } catch (e) {
      console.error("crear tarea", e);
      toast.error("No se pudo crear la tarea");
    }
  };

  const completar = async (id: number) => {
    try {
      await api.patch(`/tareas/${id}`, {});
      toast.success("Tarea completada");
      await cargar();
    } catch (e) {
      console.error("complete", e);
      toast.error("No se pudo completar");
    }
  };

  const eliminar = async (id: number) => {
    try {
      await api.delete(`/tareas/${id}`);
      toast.success("Tarea eliminada");
      await cargar();
    } catch (e) {
      console.error("delete", e);
      toast.error("No se pudo eliminar");
    }
  };

  const lista = tareas.filter(t => {
    const q = filtroTexto.toLowerCase();
    return !q || t.titulo.toLowerCase().includes(q) || (t.cliente_nombre || "").toLowerCase().includes(q);
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">✅ Tareas</h1>

      {/* alta rápida */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Título"
          value={nueva.titulo}
          onChange={(e) => setNueva((s) => ({ ...s, titulo: e.target.value }))}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Descripción (opcional)"
          value={nueva.descripcion || ""}
          onChange={(e) => setNueva((s) => ({ ...s, descripcion: e.target.value }))}
        />
        <select
          className="border rounded px-3 py-2"
          value={nueva.cliente_id ?? ""}
          onChange={(e) => setNueva((s) => ({ ...s, cliente_id: e.target.value ? Number(e.target.value) : "" }))}
        >
          <option value="">Sin cliente</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input
          type="datetime-local"
          className="border rounded px-3 py-2"
          value={nueva.vence_en || ""}
          onChange={(e) => setNueva((s) => ({ ...s, vence_en: e.target.value }))}
        />
        <div className="sm:col-span-4 text-right">
          <button className="bg-black text-white px-4 py-2 rounded" onClick={agregar}>Agregar</button>
        </div>
      </div>

      {/* filtros */}
      <div className="flex items-center justify-between mb-3">
        <input
          className="border rounded px-3 py-2 w-64"
          placeholder="Filtrar por texto/cliente…"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
      </div>

      {/* lista */}
      <div className="bg-white rounded-xl shadow divide-y">
        {lista.map((t) => (
          <div key={t.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.titulo}</div>
              <div className="text-xs text-gray-500">
                {t.cliente_nombre || "—"} • {t.vence_en ? `Vence: ${new Date(t.vence_en).toLocaleString()}` : "Sin vencimiento"}
              </div>
            </div>
            <div className="flex gap-2">
              {!t.completada && (
                <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => completar(t.id)}>
                  Completar
                </button>
              )}
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => eliminar(t.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {lista.length === 0 && <div className="p-4 text-sm text-gray-500">Sin tareas.</div>}
      </div>
    </div>
  );
}
