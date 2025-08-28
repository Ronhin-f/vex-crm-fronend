// src/main.jsx
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate, Link } from "react-router-dom";
import "./index.css";
import "./i18n";
import App from "./App";
import RutaProtegida from "./components/RutaPrivada";
import { AuthProvider } from "./context/AuthContext";

// ─── Lazy routes (code split) ────────────────────────────────────────────────
const DashboardCRM   = lazy(() => import("./routes/DashboardCRM"));
const Clientes       = lazy(() => import("./routes/Clientes"));
const Tareas         = lazy(() => import("./routes/Tareas"));
const Compras        = lazy(() => import("./routes/Compras"));
const ClientesKanban = lazy(() => import("./routes/ClientesKanban"));
const TareasKanban   = lazy(() => import("./routes/TareasKanban"));

const PageLoader = () => (
  <div className="p-6">
    <div className="skeleton h-8 w-48 mb-4" />
    <div className="skeleton h-24 w-full" />
  </div>
);

const ErrorFallback = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-2">Página no encontrada</h1>
    <Link className="btn btn-primary" to="/">Volver al dashboard</Link>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Login bridge (Core → CRM): soporta ?vex_token=&user= y legado ?token=
   Guarda en localStorage y limpia la URL.
   ────────────────────────────────────────────────────────────── */
(() => {
  const params = new URLSearchParams(window.location.search);
  const vexToken = params.get("vex_token") || params.get("token");
  const userParam = params.get("user");
  let didChange = false;

  if (vexToken) {
    localStorage.setItem("vex_token", vexToken);
    localStorage.setItem("token", vexToken); // compat
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
    } catch {
      // ignore parse errors
    }
  }
  if (didChange) {
    const clean = window.location.origin + window.location.pathname; // limpiamos query y hash
    window.history.replaceState({}, document.title, clean);
  }
})();

// ─── Router protegido ────────────────────────────────────────────────────────
const withSuspense = (el) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RutaProtegida>
        <App />
      </RutaProtegida>
    ),
    errorElement: <ErrorFallback />,
    children: [
      { index: true, element: withSuspense(<DashboardCRM />) },
      { path: "dashboard", element: <Navigate to="/" replace /> }, // alias legacy
      { path: "clientes", element: withSuspense(<Clientes />) },
      { path: "tareas", element: withSuspense(<Tareas />) },
      { path: "compras", element: withSuspense(<Compras />) },

      // Kanban
      { path: "pipeline", element: withSuspense(<ClientesKanban />) },
      { path: "kanban-tareas", element: withSuspense(<TareasKanban />) },

      // Aliases/retrocompat
      { path: "kanban", element: <Navigate to="/kanban-tareas" replace /> },
      { path: "pipeline-clientes", element: <Navigate to="/pipeline" replace /> },

      // Catch-all
      { path: "*", element: <ErrorFallback /> },
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
