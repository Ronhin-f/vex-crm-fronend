import { useEffect } from "react";
import { logout } from "../utils/logout";

export function useCrossTabLogout() {
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "logout-event") {
        console.warn("🛑 Logout detectado desde otro módulo.");
        logout();
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
}
