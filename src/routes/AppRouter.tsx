import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "../App";
import RutaProtegida from "../components/RutaProtegida";
import Login from "./Login";
import DashboardCRM from "./DashboardCRM";
import Clientes from "./Clientes";
import Tareas from "./Tareas";
import Compras from "./Compras";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <RutaProtegida>
              <App />
            </RutaProtegida>
          }
        >
          <Route index element={<DashboardCRM />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="tareas" element={<Tareas />} />
          <Route path="compras" element={<Compras />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
