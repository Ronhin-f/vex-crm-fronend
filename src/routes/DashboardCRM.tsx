import { useEffect, useState } from "react";
import api from "../utils/api";

export default function DashboardCRM() {
  const [datos, setDatos] = useState({
    totalClientes: 0,
    tareasPendientes: 0,
    tareasCompletadas: 0,
    totalCompras: 0,
  });

  const cargarDatos = async () => {
    try {
      const res = await api.get("/dashboard-crm");
      setDatos(res.data);
    } catch (err) {
      console.error("❌ Error al cargar dashboard CRM:", err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Resumen General</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow rounded">
          <div className="stat-title">Clientes</div>
          <div className="stat-value">{datos.totalClientes}</div>
        </div>
        <div className="stat bg-base-100 shadow rounded">
          <div className="stat-title">Tareas Pendientes</div>
          <div className="stat-value text-warning">{datos.tareasPendientes}</div>
        </div>
        <div className="stat bg-base-100 shadow rounded">
          <div className="stat-title">Tareas Completadas</div>
          <div className="stat-value text-success">{datos.tareasCompletadas}</div>
        </div>
        <div className="stat bg-base-100 shadow rounded">
          <div className="stat-title">Compras registradas</div>
          <div className="stat-value">{datos.totalCompras}</div>
        </div>
      </div>
    </div>
  );
}
