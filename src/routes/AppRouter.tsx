// src/routes/AppRouter.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RutaProtegida from "../components/RutaProtegida";
import DashboardCRM from "./DashboardCRM";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route
          path="/*"
          element={
            <RutaProtegida>
              <DashboardCRM />
            </RutaProtegida>
          }
        />
      </Routes>
    </Router>
  );
}
