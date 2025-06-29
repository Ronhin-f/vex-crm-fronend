// src/routes/AppRouter.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RutaProtegida from "../components/RutaProtegida";
import DashboardCRM from "./DashboardCRM";
import Clientes from "./Clientes";
import Tareas from "./Tareas";
import Compras from "./Compras";
import Header from "../components/Header"; // si lo vas a usar

export default function AppRouter() {
  return (
    <Router>
      <RutaProtegida>
        <Header />
        <Routes>
          <Route path="/" element={<DashboardCRM />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </RutaProtegida>
    </Router>
  );
}
