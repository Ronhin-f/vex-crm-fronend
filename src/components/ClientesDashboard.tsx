import { useEffect, useState } from "react";
import { Users, Phone, Tag, Edit, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

interface Cliente {
  id: number;
  nombre: string;
  contacto?: string;
  categoria?: string;
}

export default function ClientesDashboard() {
  const { token } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filtro, setFiltro] = useState("");

  const cargarClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch {
      toast.error("No se pudo cargar clientes");
    }
  };

  useEffect(() => {
    if (token) cargarClientes();
  }, [token]);

  const agregarCliente = async () => {
    if (!nombre.trim()) return toast.error("Falta el nombre");
    try {
      await api.post("/clientes", { nombre, contacto, categoria });
      toast.success("Cliente agregado");
      setNombre(""); setContacto(""); setCategoria("");
      cargarClientes();
    } catch {
      toast.error("Error al agregar cliente");
    }
  };

  const eliminarCliente = async (id: number) => {
    if (!confirm("¿Eliminar cliente?")) return;
    try {
      await api.delete(`/clientes/${id}`);
      toast.success("Cliente eliminado");
      cargarClientes();
    } catch {
      toast.error("Error al eliminar cliente");
    }
  };

  const editarCliente = async (cliente: Cliente) => {
    const nuevoNombre = prompt("Nuevo nombre:", cliente.nombre);
    const nuevoContacto = prompt("Nuevo contacto:", cliente.contacto || "");
    const nuevaCategoria = prompt("Nueva categoría:", cliente.categoria || "");
    if (!nuevoNombre?.trim()) return;

    try {
      await api.put(`/clientes/${cliente.id}`, {
        nombre: nuevoNombre,
        contacto: nuevoContacto,
        categoria: nuevaCategoria
      });
      toast.success("Cliente actualizado");
      cargarClientes();
    } catch {
      toast.error("No se pudo editar cliente");
    }
  };

  const clientesFiltrados = clientes.filter((c) => {
    const txt = filtro.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(txt) ||
      c.contacto?.toLowerCase().includes(txt) ||
      c.categoria?.toLowerCase().includes(txt)
    );
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-orange-700">📇 Clientes registrados</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
        <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="input input-bordered input-sm" />
        <input type="text" placeholder="Contacto" value={contacto} onChange={(e) => setContacto(e.target.value)} className="input input-bordered input-sm" />
        <input type="text" placeholder="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input input-bordered input-sm" />
        <button onClick={agregarCliente} className="btn btn-sm bg-orange-600 hover:bg-orange-700 text-white">Agregar</button>
      </div>

      <input type="text" placeholder="Buscar..." value={filtro} onChange={(e) => setFiltro(e.target.value)} className="input input-bordered input-sm mb-6 w-full" />

      {clientesFiltrados.length === 0 ? (
        <p className="text-sm text-gray-400">No hay clientes o no coinciden con el filtro.</p>
      ) : (
        <div className="grid gap-4">
          {clientesFiltrados.map((cliente) => (
            <div key={cliente.id} className="bg-orange-50 p-4 rounded-xl shadow flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                  <Users size={18} /> {cliente.nombre}
                </p>
                <p className="text-sm text-gray-600 flex gap-2 mt-1">
                  {cliente.contacto && <span className="flex items-center gap-1"><Phone size={14} /> {cliente.contacto}</span>}
                  {cliente.categoria && <span className="flex items-center gap-1"><Tag size={14} /> {cliente.categoria}</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editarCliente(cliente)} className="btn btn-xs bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Edit size={14} />
                </button>
                <button onClick={() => eliminarCliente(cliente.id)} className="btn btn-xs bg-red-500 hover:bg-red-600 text-white">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
