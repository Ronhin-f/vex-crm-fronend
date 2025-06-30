import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import App from "./App";
import Clientes from "./routes/Clientes";
import Tareas from "./routes/Tareas";
import Compras from "./routes/Compras";
import DashboardCRM from "./routes/DashboardCRM";
import RutaProtegida from "./components/RutaProtegida";
import { AuthProvider } from "./context/AuthContext";

// 🧠 Si el token viene desde Vex Core por URL, lo guardamos
const urlParams = new URLSearchParams(window.location.search);
const tokenFromURL = urlParams.get("token");

if (tokenFromURL) {
  localStorage.setItem("token", tokenFromURL);

  // Limpia la URL visualmente para mayor seguridad
  const cleanURL = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanURL);
}

// 🧭 Definición de rutas protegidas
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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
