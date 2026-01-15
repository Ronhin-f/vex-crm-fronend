// src/routes/Pos.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Wallet,
  Percent,
  Tag,
} from "lucide-react";
import api from "../utils/api";

const formatMoney = (n) => {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
};

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "cuenta", label: "Cuenta corriente" },
  { value: "otro", label: "Otro" },
];

export default function Pos() {
  const [loading, setLoading] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  const [caja, setCaja] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [almacenes, setAlmacenes] = useState([]);

  const [formOpen, setFormOpen] = useState({
    almacen_id: "",
    apertura_monto: "0",
    notas: "",
  });

  const [busqueda, setBusqueda] = useState("");
  const [codigo, setCodigo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [carrito, setCarrito] = useState([]);

  const [medioPago, setMedioPago] = useState("efectivo");
  const [descMedioTipo, setDescMedioTipo] = useState("none");
  const [descMedioValor, setDescMedioValor] = useState("0");
  const [descCantActiva, setDescCantActiva] = useState(false);
  const [descCantMin, setDescCantMin] = useState("3");
  const [descCantPct, setDescCantPct] = useState("10");
  const [descManual, setDescManual] = useState("0");

  const loadCaja = async () => {
    const res = await api.get("/caja", { params: { estado: "abierta", page: 1, pageSize: 1 } });
    const rows = Array.isArray(res.data?.rows) ? res.data.rows : [];
    setCaja(rows[0] || null);
  };

  const loadDetalle = async (id) => {
    const res = await api.get(`/caja/${id}`);
    setDetalle(res.data || null);
  };

  const loadAlmacenes = async () => {
    try {
      const res = await api.get("/stock/almacenes");
      setAlmacenes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCaja(), loadAlmacenes()]);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cargar POS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (caja?.id) {
      loadDetalle(caja.id).catch(() => {});
    } else {
      setDetalle(null);
    }
  }, [caja?.id]);

  const handleOpenChange = (field) => (e) => {
    const value = e.target.value;
    setFormOpen((prev) => ({ ...prev, [field]: value }));
  };

  const abrirCaja = async () => {
    const almacenId = Number(formOpen.almacen_id);
    if (!Number.isFinite(almacenId)) {
      toast.error("almacen_id requerido");
      return;
    }

    const apertura = Number(formOpen.apertura_monto || 0);

    try {
      await api.post("/caja", {
        almacen_id: almacenId,
        apertura_monto: Number.isFinite(apertura) ? apertura : 0,
        notas: formOpen.notas || null,
      });
      toast.success("Caja abierta");
      setFormOpen({ almacen_id: "", apertura_monto: "0", notas: "" });
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo abrir la caja");
    }
  };

  const buscarProductos = async () => {
    if (!busqueda && !codigo) {
      toast.error("Ingresa busqueda o codigo");
      return;
    }
    setLoadingSearch(true);
    try {
      const params = {
        q: busqueda || undefined,
        codigo: codigo || undefined,
        almacen_id: caja?.almacen_id || undefined,
        page: 1,
        pageSize: 20,
      };
      const res = await api.get("/stock/productos", { params });
      setResultados(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo buscar productos");
    } finally {
      setLoadingSearch(false);
    }
  };

  const addToCart = (prod) => {
    setCarrito((prev) => {
      const idx = prev.findIndex((p) => p.producto_id === prod.id);
      const precio = toNum(prod.costo ?? prod.precio ?? 0, 0);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
      }
      return [
        ...prev,
        {
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          codigo_qr: prod.codigo_qr || prod.codigo || null,
          precio_unitario: precio,
          cantidad: 1,
          stock: toNum(prod.stock ?? prod.cantidad ?? 0, 0),
        },
      ];
    });
  };

  const updateQty = (producto_id, delta) => {
    setCarrito((prev) =>
      prev
        .map((it) => {
          if (it.producto_id !== producto_id) return it;
          const nextQty = Math.max(1, it.cantidad + delta);
          return { ...it, cantidad: nextQty };
        })
        .filter((it) => it.cantidad > 0)
    );
  };

  const removeItem = (producto_id) => {
    setCarrito((prev) => prev.filter((it) => it.producto_id !== producto_id));
  };

  const subtotal = useMemo(
    () => carrito.reduce((acc, it) => acc + it.cantidad * toNum(it.precio_unitario, 0), 0),
    [carrito]
  );

  const descuentoCantidad = useMemo(() => {
    if (!descCantActiva) return 0;
    const min = Math.max(1, parseInt(descCantMin, 10) || 1);
    const pct = Math.max(0, Math.min(100, toNum(descCantPct, 0)));
    return carrito.reduce((acc, it) => {
      if (it.cantidad >= min) {
        return acc + it.cantidad * toNum(it.precio_unitario, 0) * (pct / 100);
      }
      return acc;
    }, 0);
  }, [carrito, descCantActiva, descCantMin, descCantPct]);

  const descuentoMedio = useMemo(() => {
    const base = Math.max(0, subtotal - descuentoCantidad);
    const val = Math.max(0, toNum(descMedioValor, 0));
    if (descMedioTipo === "percent") return base * (Math.min(100, val) / 100);
    if (descMedioTipo === "fixed") return Math.min(base, val);
    return 0;
  }, [subtotal, descuentoCantidad, descMedioTipo, descMedioValor]);

  const descuentoManualNum = Math.max(0, toNum(descManual, 0));

  const descuentoTotal = Math.min(
    subtotal,
    Math.max(0, descuentoCantidad + descuentoMedio + descuentoManualNum)
  );

  const total = Math.max(0, subtotal - descuentoTotal);

  const confirmarVenta = async () => {
    if (!caja?.id) {
      toast.error("No hay caja abierta");
      return;
    }
    if (!carrito.length) {
      toast.error("Carrito vacio");
      return;
    }

    setLoadingConfirm(true);
    try {
      const payload = {
        almacen_id: Number(caja.almacen_id),
        caja_id: caja.id,
        medio_pago: medioPago,
        descuento_total: Number(descuentoTotal.toFixed(2)),
        total: Number(total.toFixed(2)),
        notas: `pos; desc_cant=${formatMoney(descuentoCantidad)}; desc_medio=${formatMoney(descuentoMedio)}; desc_manual=${formatMoney(descuentoManualNum)}`,
        items: carrito.map((it) => ({
          producto_id: it.producto_id,
          producto_nombre: it.producto_nombre,
          codigo_qr: it.codigo_qr || undefined,
          cantidad: it.cantidad,
          precio_unitario: Number(toNum(it.precio_unitario, 0).toFixed(2)),
        })),
      };

      const res = await api.post("/cobros", payload);
      if (res?.data?.estado === "confirmado") {
        toast.success("Venta confirmada");
        setCarrito([]);
        setResultados([]);
        setBusqueda("");
        setCodigo("");
        await loadDetalle(caja.id);
      } else {
        toast.error("Venta registrada con error de stock");
      }
    } catch (e) {
      console.error(e);
      toast.error("No se pudo confirmar la venta");
    } finally {
      setLoadingConfirm(false);
    }
  };

  const cobrosCount = detalle?.cobros_count || 0;
  const cobrosTotal = detalle?.cobros_total || 0;

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">POS</h1>
          <p className="text-sm text-base-content/60">
            Caja {caja ? `abierta (almacen ${caja.almacen_id})` : "no abierta"}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={loadAll} disabled={loading}>
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {!caja && (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div className="flex items-center gap-2 text-base font-semibold mb-3">
            <Wallet className="w-5 h-5" /> Abrir caja
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="form-control">
              <span className="label-text">Almacen</span>
              <select
                className="select select-bordered"
                value={formOpen.almacen_id}
                onChange={handleOpenChange("almacen_id")}
              >
                <option value="">Selecciona almacen</option>
                {almacenes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre || `Almacen ${a.id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text">Monto apertura</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input input-bordered"
                value={formOpen.apertura_monto}
                onChange={handleOpenChange("apertura_monto")}
              />
            </label>
            <label className="form-control">
              <span className="label-text">Notas</span>
              <input
                className="input input-bordered"
                value={formOpen.notas}
                onChange={handleOpenChange("notas")}
                placeholder="opcional"
              />
            </label>
          </div>
          <div className="mt-4">
            <button type="button" className="btn btn-primary" onClick={abrirCaja}>
              Abrir caja
            </button>
          </div>
        </div>
      )}

      {caja && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
              <div className="flex items-center gap-2 text-base font-semibold mb-3">
                <Search className="w-5 h-5" /> Buscar productos
              </div>
              <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
                <input
                  className="input input-bordered"
                  placeholder="Buscar por nombre"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarProductos()}
                />
                <input
                  className="input input-bordered"
                  placeholder="Codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarProductos()}
                />
                <button type="button" className="btn btn-primary" onClick={buscarProductos} disabled={loadingSearch}>
                  Buscar
                </button>
              </div>
              <div className="mt-4">
                {loadingSearch ? (
                  <div className="text-sm text-base-content/60">Buscando...</div>
                ) : resultados.length === 0 ? (
                  <div className="text-sm text-base-content/60">Sin resultados</div>
                ) : (
                  <div className="grid gap-2">
                    {resultados.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-base-200 p-3">
                        <div>
                          <div className="font-semibold">{p.nombre}</div>
                          <div className="text-xs text-base-content/60">
                            Codigo: {p.codigo_qr || p.codigo || "-"} | Stock: {p.cantidad ?? p.stock ?? 0}
                          </div>
                        </div>
                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => addToCart(p)}>
                          <Plus className="w-4 h-4" /> Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
              <div className="flex items-center gap-2 text-base font-semibold mb-3">
                <Tag className="w-5 h-5" /> Carrito
              </div>
              {carrito.length === 0 ? (
                <div className="text-sm text-base-content/60">No hay items</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="text-center">Cant</th>
                        <th className="text-right">Precio</th>
                        <th className="text-right">Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {carrito.map((it) => (
                        <tr key={it.producto_id}>
                          <td>
                            <div className="font-semibold">{it.producto_nombre}</div>
                            <div className="text-xs text-base-content/60">{it.codigo_qr || "-"}</div>
                          </td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button className="btn btn-xs" onClick={() => updateQty(it.producto_id, -1)}>-</button>
                              <span className="min-w-[24px] text-center">{it.cantidad}</span>
                              <button className="btn btn-xs" onClick={() => updateQty(it.producto_id, 1)}>+</button>
                            </div>
                          </td>
                          <td className="text-right">${formatMoney(it.precio_unitario)}</td>
                          <td className="text-right">${formatMoney(it.cantidad * it.precio_unitario)}</td>
                          <td className="text-right">
                            <button className="btn btn-ghost btn-xs" onClick={() => removeItem(it.producto_id)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
              <div className="flex items-center gap-2 text-base font-semibold mb-3">
                <Percent className="w-5 h-5" /> Descuentos y pago
              </div>

              <div className="grid gap-3">
                <label className="form-control">
                  <span className="label-text">Metodo de pago</span>
                  <select className="select select-bordered" value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-2 md:grid-cols-[1fr,1fr]">
                  <label className="form-control">
                    <span className="label-text">Descuento por medio</span>
                    <select className="select select-bordered" value={descMedioTipo} onChange={(e) => setDescMedioTipo(e.target.value)}>
                      <option value="none">Sin descuento</option>
                      <option value="percent">Porcentaje</option>
                      <option value="fixed">Monto fijo</option>
                    </select>
                  </label>
                  <label className="form-control">
                    <span className="label-text">Valor</span>
                    <input
                      className="input input-bordered"
                      type="number"
                      min="0"
                      step="0.01"
                      value={descMedioValor}
                      onChange={(e) => setDescMedioValor(e.target.value)}
                      disabled={descMedioTipo === "none"}
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-base-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Descuento por cantidad</div>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={descCantActiva}
                      onChange={(e) => setDescCantActiva(e.target.checked)}
                    />
                  </div>
                  {descCantActiva && (
                    <div className="grid gap-2 mt-3 md:grid-cols-2">
                      <label className="form-control">
                        <span className="label-text">Minimo unidades</span>
                        <input
                          className="input input-bordered"
                          type="number"
                          min="1"
                          value={descCantMin}
                          onChange={(e) => setDescCantMin(e.target.value)}
                        />
                      </label>
                      <label className="form-control">
                        <span className="label-text">Descuento %</span>
                        <input
                          className="input input-bordered"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={descCantPct}
                          onChange={(e) => setDescCantPct(e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <label className="form-control">
                  <span className="label-text">Descuento manual</span>
                  <input
                    className="input input-bordered"
                    type="number"
                    min="0"
                    step="0.01"
                    value={descManual}
                    onChange={(e) => setDescManual(e.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>${formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Desc. cantidad</span>
                  <span>-${formatMoney(descuentoCantidad)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Desc. medio</span>
                  <span>-${formatMoney(descuentoMedio)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Desc. manual</span>
                  <span>-${formatMoney(descuentoManualNum)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${formatMoney(total)}</span>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="btn btn-primary btn-lg w-full"
                  onClick={confirmarVenta}
                  disabled={loadingConfirm}
                >
                  Confirmar venta
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
              <div className="text-sm text-base-content/60">Cobros en caja</div>
              <div className="text-2xl font-semibold">${formatMoney(cobrosTotal)}</div>
              <div className="text-xs text-base-content/60">{cobrosCount} cobros</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
