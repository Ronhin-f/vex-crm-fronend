import { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

type Tarea = {
  id: number;
  titulo: string;
  completada: boolean;
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
      toast.error("Error al cargar tareas");
    }
  };

  useEffect(() => {
    if (token) cargarTareas();
  }, [token]);

  const agregarTarea = async () => {
    if (!nuevaTarea.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    try {
      await api.post("/tareas", { titulo: nuevaTarea });
      toast.success("Tarea agregada");
      setNuevaTarea("");
      cargarTareas();
    } catch (err) {
      console.error("❌ Error al agregar tarea:", err);
      toast.error("No se pudo agregar la tarea");
    }
  };

  const completarTarea = async (id: number) => {
    try {
      await api.patch(`/tareas/${id}`, { completada: true });
      toast.success("Tarea completada");
      cargarTareas();
    } catch (err) {
      console.error("❌ Error al completar tarea:", err);
      toast.error("No se pudo completar");
    }
  };

  const eliminarTarea = async (id: number) => {
    if (!confirm("¿Eliminar tarea?")) return;
    try {
      await api.delete(`/tareas/${id}`);
      toast.success("Tarea eliminada");
      cargarTareas();
    } catch (err) {
      console.error("❌ Error al eliminar tarea:", err);
      toast.error("No se pudo eliminar");
    }
  };

  const editarTarea = async (tarea: Tarea) => {
    const nuevoTitulo = prompt("Editar título de la tarea:", tarea.titulo);
    if (!nuevoTitulo?.trim()) return;

    try {
      await api.patch(`/tareas/${tarea.id}`, { titulo: nuevoTitulo });
      toast.success("Tarea actualizada");
      cargarTareas();
    } catch (err) {
      console.error("❌ Error al editar tarea:", err);
      toast.error("No se pudo editar");
    }
  };

  const tareasFiltradas = tareas.filter((t) => {
    const coincideTexto = t.titulo.toLowerCase().includes(filtroTexto.toLowerCase());
    const coincideEstado =
      filtroEstado === "todas" ||
      (filtroEstado === "pendiente" && !t.completada) ||
      (filtroEstado === "completada" && t.completada);
    return coincideTexto && coincideEstado;
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">📝 Tareas</h2>

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

      {tareasFiltradas.length === 0 ? (
        <p className="text-sm text-gray-500">No hay tareas que coincidan con el filtro.</p>
      ) : (
        <ul className="space-y-2">
          {tareasFiltradas.map((tarea) => (
            <li
              key={tarea.id}
              className={`p-2 rounded shadow flex justify-between items-center text-sm ${
                tarea.completada ? "bg-green-100" : "bg-white"
              }`}
            >
              <span
                className={tarea.completada ? "line-through" : ""}
                onDoubleClick={() => editarTarea(tarea)}
                title="Doble clic para editar"
              >
                {tarea.titulo}
              </span>
              <div className="flex gap-1">
                {!tarea.completada && (
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
      )}
    </div>
  );
}
