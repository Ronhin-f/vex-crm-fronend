import { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext"; // si migrás a hook JS, cambiá a ../hooks/useAuthFromLocalStorage
import toast from "react-hot-toast";

export default function ListaDeCompras() {
  const { token } = useAuth();
  const [lista, setLista] = useState([]);
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [observacion, setObservacion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [filtroTexto, setFiltroTexto] = useState("");

  const cargarLista = async () => {
    try {
      const res = await api.get("/compras");
      const data = Array.isArray(res?.data) ? res.data : [];
      setLista(data);
    } catch (err) {
      console.error("❌ Error al cargar lista:", err);
      toast.error("Error al cargar la lista");
    }
  };

  useEffect(() => {
    if (token) cargarLista();
  }, [token]);

  const agregarItem = async () => {
    const cant = Number(cantidad);
    if (!producto.trim() || Number.isNaN(cant) || cant <= 0) {
      toast.error("Producto y cantidad válida son requeridos");
      return;
    }

    try {
      await api.post("/compras", {
        producto: producto.trim(),
        cantidad: cant,
        observacion: observacion?.trim() || null,
        fecha: new Date().toISOString().split("T")[0],
      });
      toast.success("Producto agregado");
      setProducto("");
      setCantidad(1);
      setObservacion("");
      cargarLista();
    } catch (err) {
      console.error("❌ Error al agregar item:", err);
      toast.error("No se pudo agregar el producto");
    }
  };

  const eliminarItem = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;

    try {
      await api.delete(`/compras/${id}`);
      toast.success("Producto eliminado");
      cargarLista();
    } catch (err) {
      console.error("❌ Error al eliminar item:", err);
      toast.error("No se pudo eliminar");
    }
  };

  const editarItem = async (item) => {
    const nuevoProducto = window.prompt("Producto:", item.producto);
    const cantStr = window.prompt("Cantidad:", String(item.cantidad));
    const nuevaCantidad = Number(cantStr);
    const nuevaObs = window.prompt("Observación:", item.observacion || "");

    if (!nuevoProducto || !nuevoProducto.trim() || Number.isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
      toast.error("Datos inválidos");
      return;
    }

    try {
      await api.put(`/compras/${item.id}`, {
        producto: nuevoProducto.trim(),
        cantidad: nuevaCantidad,
        observacion: (nuevaObs ?? "").trim(),
      });
      toast.success("Producto actualizado");
      cargarLista();
    } catch (err) {
      console.error("❌ Error al editar item:", err);
      toast.error("No se pudo editar");
    }
  };

  const interpretarMensaje = async () => {
    const texto = (mensaje || "").trim();
    if (!texto) {
      toast.error("Escribí un mensaje para interpretar");
      return;
    }

    // Mejor separación: coma o " y " con espacios (evita cortar palabras con 'y' adentro)
    const partes = texto.split(/\s*(?:,| y )\s*/i).filter(Boolean);
    const hoy = new Date().toISOString().split("T")[0];

    try {
      for (const p of partes) {
        // Formato: "<numero> <producto...>"
        const match = p.match(/^(\d+)\s+(.+)$/);
        if (match) {
          const cant = Number(match[1]);
          const prod = match[2]?.trim();
          if (prod && cant > 0) {
            await api.post("/compras", {
              producto: prod,
              cantidad: cant,
              fecha: hoy,
            });
          }
        }
      }
      toast.success("Mensaje interpretado");
      setMensaje("");
      setTimeout(() => cargarLista(), 300);
    } catch (err) {
      console.error("❌ Error al interpretar:", err);
      toast.error("No se pudo interpretar el mensaje");
    }
  };

  const listaFiltrada = lista.filter((item) => {
    const texto = (filtroTexto || "").toLowerCase();
    const prod = (item?.producto || "").toLowerCase();
    const obs = (item?.observacion || "").toLowerCase();
    const cant = String(item?.cantidad ?? "");
    return !texto || prod.includes(texto) || obs.includes(texto) || cant.includes(texto);
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">🛒 Lista de Compras</h2>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
        <input
          type="text"
          placeholder="Producto"
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          className="input input-bordered input-sm"
        />
        <input
          type="number"
          min={1}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value || 0))}
          className="input input-bordered input-sm"
        />
        <input
          type="text"
          placeholder="Observación"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          className="input input-bordered input-sm"
        />
        <button onClick={agregarItem} className="btn btn-sm btn-primary">
          Agregar
        </button>
      </div>

      <div className="mb-6">
        <textarea
          placeholder="Ej: 3 jeans y 2 celulares"
          className="textarea textarea-bordered w-full mb-2"
          rows={3}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
        <button onClick={interpretarMensaje} className="btn btn-sm btn-accent">
          Interpretar mensaje
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar en la lista..."
        value={filtroTexto}
        onChange={(e) => setFiltroTexto(e.target.value)}
        className="input input-bordered input-sm mb-4 w-full"
      />

      <ul className="space-y-2">
        {listaFiltrada.map((item) => (
          <li
            key={item.id}
            className="p-2 bg-white rounded shadow text-sm flex justify-between items-center"
          >
            <span onDoubleClick={() => editarItem(item)} title="Doble clic para editar">
              <strong>{item.cantidad}x</strong> {item.producto}
              {item.observacion && (
                <span className="ml-2 text-gray-500 italic">({item.observacion})</span>
              )}
            </span>
            <button onClick={() => eliminarItem(item.id)} className="btn btn-xs btn-error">
              ✕
            </button>
          </li>
        ))}
        {listaFiltrada.length === 0 && (
          <li className="text-center text-sm text-gray-400">No hay ítems para mostrar</li>
        )}
      </ul>
    </div>
  );
}
