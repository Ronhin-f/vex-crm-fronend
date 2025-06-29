import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type UsuarioType = {
  email: string;
  rol: string;
  organizacion_id: number;
};

type AuthContextType = {
  token: string | null;
  usuario: UsuarioType | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioType | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        const exp = payload.exp * 1000;
        if (Date.now() < exp) {
          setToken(t);
          setUsuario({
            email: payload.email,
            rol: payload.rol,
            organizacion_id: payload.organizacion_id,
          });
        } else {
          console.warn("Token expirado");
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("Token inválido", err);
        localStorage.removeItem("token");
      }
    }
  }, []);

  const login = (t: string) => {
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      setToken(t);
      setUsuario({
        email: payload.email,
        rol: payload.rol,
        organizacion_id: payload.organizacion_id,
      });
      localStorage.setItem("token", t);
    } catch (err) {
      console.error("Login con token inválido", err);
    }
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
