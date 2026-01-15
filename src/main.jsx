// src/main.jsx
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider, Navigate, Link } from "react-router-dom";
import "./index.css";
import "./i18n";
import App from "./App";
import RutaProtegida from "./components/RutaPrivada";
import { AuthProvider } from "./context/AuthContext";
import { AreaProvider } from "./context/AreaContext";

const DashboardCRM = lazy(() => import("./routes/DashboardCRM"));
const Clientes = lazy(() => import("./routes/Clientes"));
const Tareas = lazy(() => import("./routes/Tareas"));
const Proveedores = lazy(() => import("./routes/Proveedores"));
const ProyectosKanban = lazy(() => import("./routes/ProyectosKanban"));
const TareasKanban = lazy(() => import("./routes/TareasKanban"));
const Facturacion = lazy(() => import("./routes/Facturacion.jsx"));
const Caja = lazy(() => import("./routes/Caja.jsx"));
const Pos = lazy(() => import("./routes/Pos.jsx"));
const AreaConfig = lazy(() => import("./routes/AreaConfig.jsx"));

const ALLOWED_AREAS = ["general", "salud", "veterinaria"];

const PageLoader = () => (
  <div className="p-6">
    <div className="skeleton h-8 w-48 mb-4" />
    <div className="skeleton h-24 w-full" />
  </div>
);

const ErrorFallback = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-2">Pagina no encontrada</h1>
    <Link className="btn btn-primary" to="/">Volver al dashboard</Link>
  </div>
);

const withSuspense = (el) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

const normalizeArea = (a) => {
  if (!a) return null;
  const v = String(a).trim().toLowerCase();
  return ALLOWED_AREAS.includes(v) ? v : null;
};

(() => {
  try {
    const paramsFrom = (str) => {
      if (!str) return new URLSearchParams();
      const i = str.indexOf("?");
      return new URLSearchParams(i >= 0 ? str.slice(i + 1) : "");
    };
    const qs = new URLSearchParams(window.location.search);
    const hs = paramsFrom(window.location.hash);

    const vexToken =
      qs.get("vex_token") || qs.get("token") || hs.get("vex_token") || hs.get("token");
    const userParam = qs.get("user") || hs.get("user");

    const parseUserParam = (raw) => {
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        try {
          return JSON.parse(decodeURIComponent(raw));
        } catch {
          return null;
        }
      }
    };

    const sanitizeUser = (candidate) => {
      if (!candidate || typeof candidate !== "object") return null;
      const org =
        candidate.organizacion_id ??
        candidate.organization_id ??
        candidate.org_id ??
        null;
      if (!org) return null;

      const email = typeof candidate.email === "string" ? candidate.email.trim() : null;
      const rol = typeof candidate.rol === "string" ? candidate.rol : null;
      const area = normalizeArea(candidate.area_vertical || candidate.area);

      const cleanOrg = String(org);
      const safeUser = {
        organizacion_id: cleanOrg,
        organization_id: cleanOrg,
      };
      if (email) safeUser.email = email;
      if (rol) safeUser.rol = rol;
      if (area) safeUser.area_vertical = area;
      return safeUser;
    };

    let changed = false;

    if (vexToken) {
      localStorage.setItem("token", vexToken);
      localStorage.setItem("vex_token", vexToken);
      changed = true;
    }

    if (userParam) {
      const parsed = parseUserParam(userParam);
      const safeUser = sanitizeUser(parsed);
      if (safeUser) {
        localStorage.setItem("user", JSON.stringify(safeUser));
        if (safeUser.email) {
          localStorage.setItem("usuario_email", safeUser.email);
          localStorage.setItem("vex_user", safeUser.email);
        }
        if (safeUser.organizacion_id) {
          localStorage.setItem("organizacion_id", safeUser.organizacion_id);
          localStorage.setItem("vex_org_id", safeUser.organizacion_id);
        }
        if (safeUser.area_vertical) {
          localStorage.setItem("vex_area_vertical", safeUser.area_vertical);
        }
        localStorage.setItem("login-event", String(Date.now()));
        changed = true;
      }
    }

    if (changed) {
      const target = location.hash && location.hash.startsWith("#/") ? location.hash : "#/";
      history.replaceState({}, document.title, "/" + target);
    }
  } catch {
    // silencioso
  }
})();

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
      { path: "clientes", element: withSuspense(<Clientes />) },
      { path: "tareas", element: withSuspense(<Tareas />) },
      { path: "proveedores", element: withSuspense(<Proveedores />) },
      { path: "compras", element: <Navigate to="/proveedores" replace /> },
      { path: "pipeline", element: withSuspense(<ProyectosKanban />) },
      { path: "kanban-tareas", element: withSuspense(<TareasKanban />) },
      { path: "pos", element: withSuspense(<Pos />) },
      { path: "caja", element: withSuspense(<Caja />) },
      { path: "facturacion", element: withSuspense(<Facturacion />) },
      { path: "billing", element: <Navigate to="/facturacion" replace /> },
      { path: "area", element: withSuspense(<AreaConfig />) },
      { path: "kanban", element: <Navigate to="/kanban-tareas" replace /> },
      { path: "pipeline-clientes", element: <Navigate to="/pipeline" replace /> },
      { path: "proyectos", element: <Navigate to="/pipeline" replace /> },
      { path: "*", element: <ErrorFallback /> },
    ],
  },
]);

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <AuthProvider>
        <AreaProvider>
          <RouterProvider router={router} />
        </AreaProvider>
      </AuthProvider>
    </React.StrictMode>
  );
} else {
  console.error("No se encontro el elemento #root");
}
