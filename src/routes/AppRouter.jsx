// src/routes/AppRouter.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RutaProtegida from "../components/RutaPrivada";
import DashboardCRM from "./DashboardCRM";
import Clientes from "./Clientes";
import Tareas from "./Tareas";
import Compras from "./Compras";

export default function AppRouter() {
  return (
    <Router>
      <RutaProtegida>
          <Routes>
          <Route path="/" element={<DashboardCRM />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RutaProtegida>
    </Router>
  );
}
