import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { Toaster } from "react-hot-toast";
import { useCrossTabLogout } from "./hooks/useCrossTabLogout";

export default function App() {
  useCrossTabLogout();

  return (
    <div className="flex min-h-screen bg-base-200">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Toaster position="top-right" />
        <Outlet />
      </main>
    </div>
  );
}
