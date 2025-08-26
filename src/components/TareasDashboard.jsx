// Frontend/src/components/TareasDashboard.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext"; // si migrás a hook JS, cambiá a ../hooks/useAuthFromLocalStorage
import toast from "react-hot-toast";

export default function TareasDashboard() {
  const { token } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [nueva, setNueva] = useState({ titulo: "", descripcion: "", cliente_id: "", vence_en: "" });
  const [filtroTexto, setFiltroTexto] = useState("");

  const cargar = async () => {
    try {
      const [t, c] = await Promise.all([api.get("/tareas"), api.get("/clientes")]);
      setTareas(Array.isArray(t?.data) ? t.data : []);
      setClientes(Array.isArray(c?.data) ? c.data : []);
    } catch (e) {
      console.error("load", e);
      toast.error("No se pudieron cargar tareas/clientes");
    }
  };

  useEffect(() => {
    if (token) cargar().catch(console.error);
  }, [token]);

  const agregar = async () => {
    if (!nueva.titulo.trim()) {
      toast.error("Título requerido");
      return;
    }
    try {
      await api.post("/tareas", {
        titulo: nueva.titulo.trim(),
        descripcion: (nueva.descripcion || "").trim() || null,
        cliente_id: nueva.cliente_id === "" ? null : Number(nueva.cliente_id),
        vence_en: nueva.vence_en || null,
      });
      setNueva({ titulo: "", descripcion: "", cliente_id: "", vence_en: "" });
      toast.success("Tarea creada");
      await cargar();
    } catch (e) {
      console.error("crear tarea", e);
      toast.error("No se pudo crear la tarea");
    }
  };

  const completar = async (id) => {
    try {
      await api.patch(`/tareas/${id}`, {});
      toast.success("Tarea completada");
      await cargar();
    } catch (e) {
      console.error("complete", e);
      toast.error("No se pudo completar");
    }
  };

  const eliminar = async (id) => {
    try {
      await api.delete(`/tareas/${id}`);
      toast.success("Tarea eliminada");
      await cargar();
    } catch (e) {
      console.error("delete", e);
      toast.error("No se pudo eliminar");
    }
  };

  const lista = tareas.filter((t) => {
    const q = (filtroTexto || "").toLowerCase();
    const titulo = (t?.titulo || "").toLowerCase();
    const cliente = (t?.cliente_nombre || "").toLowerCase();
    return !q || titulo.includes(q) || cliente.includes(q);
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
          onChange={(e) =>
            setNueva((s) => ({ ...s, cliente_id: e.target.value ? Number(e.target.value) : "" }))
          }
        >
          <option value="">Sin cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="border rounded px-3 py-2"
          value={nueva.vence_en || ""}
          onChange={(e) => setNueva((s) => ({ ...s, vence_en: e.target.value }))}
        />
        <div className="sm:col-span-4 text-right">
          <button className="bg-black text-white px-4 py-2 rounded" onClick={agregar}>
            Agregar
          </button>
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
                {t.cliente_nombre || "—"} •{" "}
                {t.vence_en ? `Vence: ${new Date(t.vence_en).toLocaleString()}` : "Sin vencimiento"}
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
