import { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

type Cliente = {
  id: number;
  nombre: string;
  contacto?: string;
  categoria?: string;
};

export default function ClientesDashboard() {
  const { token, usuario_email } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filtro, setFiltro] = useState("");

  const cargarClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error("❌ Error al cargar clientes:", err);
    }
  };

  useEffect(() => {
    if (token) cargarClientes();
  }, [token]);

  const agregarCliente = async () => {
    if (!nombre.trim()) return;
    try {
      await api.post("/clientes", { nombre, contacto, categoria, usuario_email });
      setNombre("");
      setContacto("");
      setCategoria("");
      cargarClientes();
    } catch (err) {
      console.error("❌ Error al agregar cliente:", err);
    }
  };

  const eliminarCliente = async (id: number) => {
    try {
      await api.delete(`/clientes/${id}`);
      cargarClientes();
    } catch (err) {
      console.error("❌ Error al eliminar cliente:", err);
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
        categoria: nuevaCategoria,
        usuario_email
      });
      cargarClientes();
    } catch (err) {
      console.error("❌ Error al editar cliente:", err);
    }
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = filtro.toLowerCase();
    return (
      cliente.nombre.toLowerCase().includes(texto) ||
      cliente.contacto?.toLowerCase().includes(texto) ||
      cliente.categoria?.toLowerCase().includes(texto)
    );
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Clientes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="input input-bordered input-sm"
        />
        <input
          type="text"
          placeholder="Contacto"
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          className="input input-bordered input-sm"
        />
        <input
          type="text"
          placeholder="Categoría"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="input input-bordered input-sm"
        />
        <button onClick={agregarCliente} className="btn btn-sm btn-primary">
          Agregar
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar cliente..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="input input-bordered input-sm mb-4 w-full"
      />

      <ul className="space-y-2">
        {clientesFiltrados.map((cliente) => (
          <li
            key={cliente.id}
            className="p-2 rounded shadow bg-white flex justify-between items-center text-sm"
          >
            <span>
              <strong>{cliente.nombre}</strong>{" "}
              {cliente.contacto && <span className="text-gray-500">({cliente.contacto})</span>}
              {cliente.categoria && (
                <span className="ml-2 badge badge-outline badge-sm">{cliente.categoria}</span>
              )}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => editarCliente(cliente)}
                className="btn btn-xs btn-warning"
              >
                ✎
              </button>
              <button
                onClick={() => eliminarCliente(cliente.id)}
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
