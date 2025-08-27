// src/routes/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RutaPrivada from "../components/RutaPrivada.jsx";

import DashboardCRM from "./DashboardCRM.jsx";
import Clientes from "./Clientes.jsx";
import Tareas from "./Tareas.jsx";
import Compras from "./Compras.jsx";
import SettingsCRM from "./SettingsCRM.jsx";
import Home from "./Home.jsx";

// NUEVO
import ClientesKanban from "./ClientesKanban.jsx";
import TareasKanban from "./TareasKanban.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RutaPrivada />}>
          <Route path="/" element={<DashboardCRM />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/settings" element={<SettingsCRM />} />

          {/* NUEVAS rutas */}
          <Route path="/pipeline" element={<ClientesKanban />} />
          <Route path="/kanban-tareas" element={<TareasKanban />} />
        </Route>

        <Route path="/home" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
