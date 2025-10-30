// src/main.jsx
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider, Navigate, Link } from "react-router-dom";
import "./index.css";
import "./i18n";
import App from "./App";
import RutaProtegida from "./components/RutaPrivada";
import { AuthProvider } from "./context/AuthContext";

// Lazy routes
const DashboardCRM    = lazy(() => import("./routes/DashboardCRM"));
const Clientes        = lazy(() => import("./routes/Clientes"));
const Tareas          = lazy(() => import("./routes/Tareas"));
const Proveedores     = lazy(() => import("./routes/Proveedores"));
const ProyectosKanban = lazy(() => import("./routes/ProyectosKanban"));
const TareasKanban    = lazy(() => import("./routes/TareasKanban"));
// ✅ Facturación (ruta correcta, SIN punto extra)
const BillingPage = lazy(() => import("./features/billing/pages/BillingPage.jsx"));

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

/* Bridge Core → CRM */
(() => {
  const paramsFrom = (str) => {
    if (!str) return new URLSearchParams();
    const i = str.indexOf("?");
    return new URLSearchParams(i >= 0 ? str.slice(i + 1) : "");
  };
  const qs = new URLSearchParams(window.location.search);
  const hs = paramsFrom(window.location.hash);

  const vexToken = qs.get("vex_token") || qs.get("token") || hs.get("vex_token") || hs.get("token");
  const userParam = qs.get("user") || hs.get("user");
  let changed = false;

  if (vexToken) {
    localStorage.setItem("token", vexToken);
    localStorage.setItem("vex_token", vexToken);
    changed = true;
  }
  if (userParam) {
    try {
      const u = JSON.parse(userParam);
      localStorage.setItem("user", JSON.stringify(u));
      if (u?.email) localStorage.setItem("usuario_email", u.email);
      const orgId = u?.organizacion_id ?? u?.organization_id;
      if (orgId != null) localStorage.setItem("organizacion_id", String(orgId));
      localStorage.setItem("login-event", String(Date.now()));
      changed = true;
    } catch {
      try {
        const u = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("user", JSON.stringify(u));
        if (u?.email) localStorage.setItem("usuario_email", u.email);
        const orgId = u?.organizacion_id ?? u?.organization_id;
        if (orgId != null) localStorage.setItem("organizacion_id", String(orgId));
        localStorage.setItem("login-event", String(Date.now()));
        changed = true;
      } catch {}
    }
  }
  if (changed) {
    const target = (location.hash && location.hash.startsWith("#/")) ? location.hash : "#/";
    history.replaceState({}, document.title, "/" + target);
  }
})();

const withSuspense = (el) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

const router = createHashRouter([
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
      { path: "dashboard", element: <Navigate to="/" replace /> },

      // CRM
      { path: "clientes", element: withSuspense(<Clientes />) },
      { path: "tareas", element: withSuspense(<Tareas />) },

      // Proveedores
      { path: "proveedores", element: withSuspense(<Proveedores />) },
      { path: "compras", element: <Navigate to="/proveedores" replace /> },

      // Kanban
      { path: "pipeline", element: withSuspense(<ProyectosKanban />) },
      { path: "kanban-tareas", element: withSuspense(<TareasKanban />) },

      // Facturación
      { path: "facturacion", element: withSuspense(<BillingPage />) },
      { path: "billing", element: <Navigate to="/facturacion" replace /> },

      // Aliases
      { path: "kanban", element: <Navigate to="/kanban-tareas" replace /> },
      { path: "pipeline-clientes", element: <Navigate to="/pipeline" replace /> },
      { path: "proyectos", element: <Navigate to="/pipeline" replace /> },

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
