// src/features/billing/components/InvoiceFilters.jsx
import { useEffect, useMemo, useState } from "react";

const DUE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "overdue", label: "Vencidas" },
  { value: "today", label: "Vencen hoy" },
  { value: "7d", label: "Vencen en 7 días" },
  { value: "30d", label: "Vencen en 30 días" },
  { value: "range", label: "Rango personalizado" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "ND", label: "N. Débito" },
  { value: "NC", label: "N. Crédito" },
];

const SEARCH_FIELDS = [
  { value: "number", label: "Número" },
  { value: "customer", label: "Cliente/Proveedor" },
  { value: "status", label: "Estado" },
];

export default function InvoiceFilters({ value, onChange }) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  function update(patch) {
    const next = { ...local, ...patch };
    setLocal(next);
    // notificar al padre
    onChange?.(next);
  }

  return (
    <div className="grid gap-3 md:grid-cols-5">
      {/* Buscador con dropdown de campo */}
      <div className="md:col-span-2 flex gap-2">
        <select
          className="border rounded px-2 py-1"
          value={local.qField}
          onChange={(e) => update({ qField: e.target.value })}
        >
          {SEARCH_FIELDS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          className="border rounded px-3 py-1 w-full"
          placeholder="Buscar…"
          value={local.q || ""}
          onChange={(e) => update({ q: e.target.value })}
        />
      </div>

      {/* Vencimiento */}
      <div>
        <label className="block text-sm mb-1">Vencimiento</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={local.due}
          onChange={(e) => update({ due: e.target.value })}
        >
          {DUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Rango personalizado (si due=range) */}
      <div className="flex gap-2">
        <input
          type="date"
          className="border rounded px-2 py-1 w-full"
          disabled={local.due !== "range"}
          value={local.dueFrom || ""}
          onChange={(e) => update({ dueFrom: e.target.value })}
        />
        <input
          type="date"
          className="border rounded px-2 py-1 w-full"
          disabled={local.due !== "range"}
          value={local.dueTo || ""}
          onChange={(e) => update({ dueTo: e.target.value })}
        />
      </div>

      {/* Tipo de factura */}
      <div>
        <label className="block text-sm mb-1">Tipo</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={local.type}
          onChange={(e) => update({ type: e.target.value })}
        >
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}
