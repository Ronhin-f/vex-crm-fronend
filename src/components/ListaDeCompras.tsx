import { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

type ItemCompra = {
  id: number;
  producto: string;
  cantidad: number;
  observacion?: string;
};

export default function ListaDeCompras() {
  const { usuario_email } = useAuth();
  const [lista, setLista] = useState<ItemCompra[]>([]);
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [observacion, setObservacion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [filtroTexto, setFiltroTexto] = useState("");

  const cargarLista = async () => {
    try {
      const res = await api.get("/compras", {
        params: { usuario_email },
      });
      setLista(res.data);
    } catch (err) {
      console.error("❌ Error al cargar lista:", err);
    }
  };

  useEffect(() => {
    if (usuario_email) cargarLista();
  }, [usuario_email]);

  const agregarItem = async () => {
    if (!producto.trim() || cantidad <= 0) return;
    try {
      await api.post("/compras", {
        producto,
        cantidad,
        observacion,
        usuario_email,
        fecha: new Date().toISOString().split("T")[0],
      });
      setProducto("");
      setCantidad(1);
      setObservacion("");
      cargarLista();
    } catch (err) {
      console.error("❌ Error al agregar item:", err);
    }
  };

  const eliminarItem = async (id: number) => {
    try {
      await api.delete(`/compras/${id}`, {
        data: { usuario_email },
      });
      cargarLista();
    } catch (err) {
      console.error("❌ Error al eliminar item:", err);
    }
  };

  const editarItem = async (item: ItemCompra) => {
    const nuevoProducto = prompt("Producto:", item.producto);
    const nuevaCantidad = Number(prompt("Cantidad:", item.cantidad.toString()));
    const nuevaObs = prompt("Observación:", item.observacion || "");

    if (!nuevoProducto?.trim() || isNaN(nuevaCantidad) || nuevaCantidad <= 0) return;

    try {
      await api.put(`/compras/${item.id}`, {
        producto: nuevoProducto,
        cantidad: nuevaCantidad,
        observacion: nuevaObs,
        usuario_email,
      });
      cargarLista();
    } catch (err) {
      console.error("❌ Error al editar item:", err);
    }
  };

  const interpretarMensaje = () => {
    const partes = mensaje.split(/,|y/);
    partes.forEach(async (p) => {
      const match = p.trim().match(/(\d+)\s+(.*)/);
      if (match) {
        const cantidad = Number(match[1]);
        const producto = match[2];
        if (producto && cantidad) {
          await api.post("/compras", {
            producto,
            cantidad,
            usuario_email,
            fecha: new Date().toISOString().split("T")[0],
          });
        }
      }
    });
    setMensaje("");
    setTimeout(() => cargarLista(), 500);
  };

  const listaFiltrada = lista.filter((item) => {
    const texto = filtroTexto.toLowerCase();
    return (
      item.producto.toLowerCase().includes(texto) ||
      item.observacion?.toLowerCase().includes(texto) ||
      item.cantidad.toString().includes(texto)
    );
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Lista de Compras</h2>

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
          onChange={(e) => setCantidad(Number(e.target.value))}
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
