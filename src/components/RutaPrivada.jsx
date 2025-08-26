// src/components/RutaPrivada.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuthFromLocalStorage";

export default function RutaPrivada({ children, rolRequerido }) {
  const { token, usuario } = useAuth();
  if (!token) return <Navigate to="/welcome" replace />;
  if (rolRequerido && usuario?.rol !== rolRequerido) return <Navigate to="/prohibido" replace />;
  return children;
}
