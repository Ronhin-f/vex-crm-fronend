import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import { Toaster } from "react-hot-toast";
import { useCrossTabLogout } from "./hooks/useCrossTabLogout";

export default function App() {
  useCrossTabLogout(); // 🔐 Escucha logout en otras pestañas

  return (
    <div className="min-h-screen bg-base-200">
      <Toaster position="top-right" />
      <Header />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
