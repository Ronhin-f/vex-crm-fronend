import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import "./i18n";
import App from "./App";
import Clientes from "./routes/Clientes";
import Tareas from "./routes/Tareas";
import Compras from "./routes/Compras";
import DashboardCRM from "./routes/DashboardCRM";
import RutaProtegida from "./components/RutaPrivada";
import { AuthProvider } from "./context/AuthContext";

// NUEVO: Kanban
import ClientesKanban from "./routes/ClientesKanban";
import TareasKanban from "./routes/TareasKanban";

// --- bridge de login (igual que el tuyo) ---
(() => {
  const params = new URLSearchParams(window.location.search);
  const vexToken = params.get("vex_token") || params.get("token");
  const userParam = params.get("user");
  let didChange = false;

  if (vexToken) {
    localStorage.setItem("vex_token", vexToken);
    localStorage.setItem("token", vexToken);
    didChange = true;
  }
  if (userParam) {
    try {
      const u = JSON.parse(decodeURIComponent(userParam));
      localStorage.setItem("user", JSON.stringify(u));
      if (u?.email) localStorage.setItem("usuario_email", u.email);
      const orgId = u?.organization_id ?? u?.organizacion_id;
      if (orgId != null) localStorage.setItem("organizacion_id", String(orgId));
      localStorage.setItem("login-event", String(Date.now()));
      didChange = true;
    } catch {}
  }
  if (didChange) {
    const clean = window.location.origin + window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, clean);
  }
})();

// --- Router protegido con layout App ---
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RutaProtegida>
        <App />
      </RutaProtegida>
    ),
    children: [
      { index: true, element: <DashboardCRM /> },
      { path: "clientes", element: <Clientes /> },
      { path: "tareas", element: <Tareas /> },
      { path: "compras", element: <Compras /> },

      // Kanban (NUEVO)
      { path: "pipeline", element: <ClientesKanban /> },
      { path: "kanban-tareas", element: <TareasKanban /> },
    ],
  },
]);

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </React.StrictMode>
  );
} else {
  console.error("No se encontró el elemento #root");
}
