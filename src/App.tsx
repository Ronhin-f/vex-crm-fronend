import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import { Toaster } from "react-hot-toast";

export default function App() {
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
