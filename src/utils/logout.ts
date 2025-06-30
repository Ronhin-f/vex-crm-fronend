export function logout() {
  localStorage.removeItem("token");
  localStorage.setItem("logout-event", Date.now().toString()); // 🔄 dispara logout cruzado
  window.location.href = "https://vex-core-frontend.vercel.app/";
}
