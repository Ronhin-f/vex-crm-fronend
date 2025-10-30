// src/features/billing/components/InvoiceRowMenu.jsx
import { useState } from "react";

export default function InvoiceRowMenu({ onView, onEdit, onMarkPaid, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="border rounded px-2 py-1" onClick={() => setOpen(v => !v)}>⋮</button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border rounded shadow text-sm z-10">
          <button className="px-3 py-2 w-full text-left hover:bg-gray-100" onClick={() => { setOpen(false); onView?.(); }}>Ver</button>
          <button className="px-3 py-2 w-full text-left hover:bg-gray-100" onClick={() => { setOpen(false); onEdit?.(); }}>Editar</button>
          <button className="px-3 py-2 w-full text-left hover:bg-gray-100" onClick={() => { setOpen(false); onMarkPaid?.(); }}>Marcar pagada</button>
          <button className="px-3 py-2 w-full text-left hover:bg-red-50 text-red-600" onClick={() => { setOpen(false); onDelete?.(); }}>Eliminar</button>
        </div>
      )}
    </div>
  );
}
