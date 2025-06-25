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
import DashboardCRM from './routes/DashboardCRM'; // 👈 nuevo import
import RutaProtegida from './components/RutaProtegida';
import { AuthProvider } from './context/AuthContext';

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
      { path: "", element: <DashboardCRM /> },         // 👈 dashboard como home
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
