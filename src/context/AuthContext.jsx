import { createContext, useContext, useMemo } from "react";
import { useAuth as useAuthFromLocalStorage } from "../hooks/useAuthFromLocalStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuthFromLocalStorage();

  const value = useMemo(
    () => auth,
    [auth.usuario, auth.token, auth.rol, auth.loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? useAuthFromLocalStorage();
}

export default AuthContext;
