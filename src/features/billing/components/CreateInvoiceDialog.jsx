// src/features/billing/components/CreateInvoiceDialog.jsx
import { useState } from "react";

export default function CreateInvoiceDialog({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ type: "B", number: "", date: "", dueDate: "", party: "", items: [] });

  if (!open) return null;

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20">
      <div className="bg-white rounded-lg p-4 w-full max-w-xl">
        <h3 className="text-lg font-semibold mb-3">Nueva factura</h3>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm mb-1">Tipo</label>
            <select className="border rounded px-2 py-1 w-full" value={form.type} onChange={e => update("type", e.target.value)}>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option>
              <option value="ND">N. Débito</option><option value="NC">N. Crédito</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Número</label>
            <input className="border rounded px-2 py-1 w-full" value={form.number} onChange={e => update("number", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Fecha</label>
            <input type="date" className="border rounded px-2 py-1 w-full" value={form.date} onChange={e => update("date", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Vencimiento</label>
            <input type="date" className="border rounded px-2 py-1 w-full" value={form.dueDate} onChange={e => update("dueDate", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Cliente/Proveedor</label>
            <input className="border rounded px-2 py-1 w-full" value={form.party} onChange={e => update("party", e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-2 border rounded" onClick={onClose}>Cancelar</button>
          <button className="px-3 py-2 bg-black text-white rounded" onClick={() => onSubmit?.(form)}>Crear</button>
        </div>
      </div>
    </div>
  );
}
