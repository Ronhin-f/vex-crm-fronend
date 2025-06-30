// src/utils/logout.ts
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario_email");
  localStorage.removeItem("organizacion_id");

  // Esto notifica a las otras pestañas
  localStorage.setItem("logout-event", Date.now().toString());

  // Redirigimos correctamente a Vex Core
  window.location.href = "https://vex-core-frontend.vercel.app/";
}
