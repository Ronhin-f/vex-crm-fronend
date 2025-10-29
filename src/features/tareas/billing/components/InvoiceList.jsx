// src/features/billing/components/InvoiceList.jsx
import InvoiceRowMenu from "./InvoiceRowMenu";

export default function InvoiceList({ rows = [], onView, onEdit, onMarkPaid, onDelete }) {
  return (
    <div className="border rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="p-2">Fecha</th>
            <th className="p-2">Número</th>
            <th className="p-2">Cliente/Proveedor</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Vence</th>
            <th className="p-2">Estado</th>
            <th className="p-2 text-right">Total</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td className="p-3 text-gray-500" colSpan={8}>Sin resultados</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.date}</td>
              <td className="p-2">{r.number}</td>
              <td className="p-2">{r.party}</td>
              <td className="p-2">{r.type}</td>
              <td className="p-2">{r.dueDate}</td>
              <td className="p-2">{r.status}</td>
              <td className="p-2 text-right">{r.total?.toLocaleString?.() ?? r.total}</td>
              <td className="p-2">
                <InvoiceRowMenu
                  onView={() => onView?.(r)}
                  onEdit={() => onEdit?.(r)}
                  onMarkPaid={() => onMarkPaid?.(r)}
                  onDelete={() => onDelete?.(r)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
