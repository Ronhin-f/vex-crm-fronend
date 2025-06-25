import { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

type Tarea = {
  id: number;
  titulo: string;
  estado: "pendiente" | "completada";
};
 
export default function TareasDashboard() {
  const { token } = useAuth();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todas" | "pendiente" | "completada">("todas");

  const cargarTareas = async () => {
    try {
      const res = await api.get("/tareas");
      setTareas(res.data);
    } catch (err) {
      console.error("❌ Error al cargar tareas:", err);
    }
  };

  useEffect(() => {
    if (token) cargarTareas();
  }, [token]);

  const agregarTarea = async () => {
    if (!nuevaTarea.trim()) return;
    try {
      await api.post("/tareas", { titulo: nuevaTarea });
      setNuevaTarea("");
      cargarTareas();
    } catch (err) {
      console.error("❌ Error al agregar tarea:", err);
    }
  };

  const completarTarea = async (id: number) => {
    try {
      await api.patch(`/tareas/${id}`, { estado: "completada" });
      cargarTareas();
    } catch (err) {
      console.error("❌ Error al completar tarea:", err);
    }
  };

  const eliminarTarea = async (id: number) => {
    try {
      await api.delete(`/tareas/${id}`);
      cargarTareas();
    } catch (err) {
      console.error("❌ Error al eliminar tarea:", err);
    }
  };

  const editarTarea = async (tarea: Tarea) => {
    const nuevoTitulo = prompt("Editar título de la tarea:", tarea.titulo);
    if (!nuevoTitulo?.trim()) return;
    try {
      await api.patch(`/tareas/${tarea.id}`, {
        titulo: nuevoTitulo,
      });
      cargarTareas();
    } catch (err) {
      console.error("❌ Error al editar tarea:", err);
    }
  };

  const tareasFiltradas = tareas.filter((t) => {
    const coincideTexto = t.titulo.toLowerCase().includes(filtroTexto.toLowerCase());
    const coincideEstado = filtroEstado === "todas" || t.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Tareas Pendientes</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nueva tarea"
          value={nuevaTarea}
          onChange={(e) => setNuevaTarea(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <button onClick={agregarTarea} className="btn btn-sm btn-primary">
          Agregar
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar tarea..."
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          className="input input-bordered input-sm w-full sm:max-w-xs"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as any)}
          className="select select-sm select-bordered"
        >
          <option value="todas">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="completada">Completadas</option>
        </select>
      </div>

      <ul className="space-y-2">
        {tareasFiltradas.map((tarea) => (
          <li
            key={tarea.id}
            className={`p-2 rounded shadow flex justify-between items-center text-sm ${
              tarea.estado === "completada" ? "bg-green-100" : "bg-white"
            }`}
          >
            <span
              className={tarea.estado === "completada" ? "line-through" : ""}
              onDoubleClick={() => editarTarea(tarea)}
              title="Doble clic para editar"
            >
              {tarea.titulo}
            </span>
            <div className="flex gap-1">
              {tarea.estado === "pendiente" && (
                <button
                  onClick={() => completarTarea(tarea.id)}
                  className="btn btn-xs btn-success"
                >
                  ✓
                </button>
              )}
              <button
                onClick={() => eliminarTarea(tarea.id)}
                className="btn btn-xs btn-error"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
