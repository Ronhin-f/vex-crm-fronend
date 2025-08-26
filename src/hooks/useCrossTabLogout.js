// src/hooks/useCrossTabLogout.js
import { logout } from "../utils/logout";

export function useCrossTabLogout() {
  // Cierra sesión en todas las pestañas si una lo hace
  // y refresca cuando hay login en otra pestaña
  window.addEventListener("storage", (e) => {
    if (e.key === "logout-event") logout();
    if (e.key === "login-event") window.location.reload();
  });
}
