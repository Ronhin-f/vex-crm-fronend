// src/main.jsx
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

/* ──────────────────────────────────────────────────────────────
   Login bridge (Core → CRM): soporta ?vex_token=&user= y legado ?token=
   Guarda en localStorage y limpia la URL.
   ────────────────────────────────────────────────────────────── */
(() => {
  const params = new URLSearchParams(window.location.search);
  const vexToken = params.get("vex_token") || params.get("token"); // compat
  const userParam = params.get("user"); // JSON URI-encoded (opcional)

  let didChange = false;

  if (vexToken) {
    localStorage.setItem("vex_token", vexToken);
    localStorage.setItem("token", vexToken); // compat con código viejo
    didChange = true;
  }

  if (userParam) {
    try {
      const u = JSON.parse(decodeURIComponent(userParam));
      localStorage.setItem("user", JSON.stringify(u));
      if (u?.email) localStorage.setItem("usuario_email", u.email);
      const orgId = u?.organization_id ?? u?.organizacion_id;
      if (orgId != null) localStorage.setItem("organizacion_id", String(orgId));
      // notificar a otras pestañas
      localStorage.setItem("login-event", String(Date.now()));
      didChange = true;
    } catch {
      // ignorar si viene malformado
    }
  }

  // limpiar querystring si vino algo
  if (didChange) {
    const clean = window.location.origin + window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, clean);
  }
})();

/* ──────────────────────────────────────────────────────────────
   Rutas protegidas
   ────────────────────────────────────────────────────────────── */
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

      // NUEVAS rutas
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
  // fallback por si el div#root no existe (evita el "!")
  console.error("No se encontró el elemento #root");
}
