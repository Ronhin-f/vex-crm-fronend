// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

import App from './App';
import Login from './routes/Login';
import Clientes from './routes/Clientes';
import Tareas from './routes/Tareas';
import Compras from './routes/Compras';
import DashboardCRM from './routes/DashboardCRM';
import RutaProtegida from './components/RutaProtegida';
import { AuthProvider } from './context/AuthContext';

// 🧠 Al iniciar: si viene un token desde Vex Core por URL, lo guardamos
const urlParams = new URLSearchParams(window.location.search);
const tokenFromURL = urlParams.get("token");

if (tokenFromURL) {
  localStorage.setItem("token", tokenFromURL);
  // Limpia la URL visual para que no quede el token expuesto
  const cleanURL = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanURL);
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <RutaProtegida>
        <App />
      </RutaProtegida>
    ),
    children: [
      { path: "", element: <DashboardCRM /> },
      { path: "clientes", element: <Clientes /> },
      { path: "tareas", element: <Tareas /> },
      { path: "compras", element: <Compras /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
