// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

type AuthContextType = {
  token: string | null;
  rol: string | null;
  usuario_email: string | null;
  organizacion_id: number | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [rol, setRol] = useState<string | null>(null);
  const [usuario_email, setUsuarioEmail] = useState<string | null>(null);
  const [organizacion_id, setOrganizacionId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      const payload = JSON.parse(atob(t.split(".")[1]));
      setToken(t);
      setRol(payload.rol);
      setUsuarioEmail(payload.email);
      setOrganizacionId(payload.organizacion_id);
    }
  }, []);

  const login = (t: string) => {
    const payload = JSON.parse(atob(t.split(".")[1]));
    setToken(t);
    setRol(payload.rol);
    setUsuarioEmail(payload.email);
    setOrganizacionId(payload.organizacion_id);
    localStorage.setItem("token", t);
    localStorage.setItem("rol", payload.rol);
    localStorage.setItem("usuario_email", payload.email);
    localStorage.setItem("organizacion_id", payload.organizacion_id);
  };

  const logout = () => {
    setToken(null);
    setRol(null);
    setUsuarioEmail(null);
    setOrganizacionId(null);
    localStorage.clear();
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ token, rol, usuario_email, organizacion_id, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
