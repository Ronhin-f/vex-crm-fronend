import { useEffect, useState } from "react";
import { Users, ClipboardList, FileText, ShoppingCart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DashboardCRM = () => {
  const { usuario, token } = useAuth();
  const [datos, setDatos] = useState({
    total_clientes: 0,
    total_tareas: 0,
    total_compras: 0,
  });

  useEffect(() => {
    if (!token) return;

    fetch("https://vex-crm-production.up.railway.app/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setDatos)
      .catch((err) => {
        console.error("Error al cargar dashboard:", err);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-800">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">📊 Vex CRM Dashboard</h1>
        <p className="mb-6 text-sm text-gray-600">
          Hola, <strong>{usuario?.email}</strong>. Gestión conectada, equipo alineado.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card icon={<Users size={24} />} label="Clientes" value={datos.total_clientes} />
          <Card icon={<ClipboardList size={24} />} label="Tareas pendientes" value={datos.total_tareas} />
          <Card icon={<FileText size={24} />} label="Tareas completadas" value="🚧" />
          <Card icon={<ShoppingCart size={24} />} label="Compras registradas" value={datos.total_compras} />
        </div>

        <p className="text-gray-500 text-sm">
          ✨ Pronto vas a poder ver reportes automáticos y sugerencias inteligentes.
        </p>
      </div>
    </div>
  );
};

const Card = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) => (
  <div className="bg-white shadow rounded-xl p-4 flex items-center gap-4">
    <div className="text-primary">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  </div>
);

export default DashboardCRM;
