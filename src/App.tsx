import { Outlet } from "react-router-dom";
import Header from "./components/Header";

export default function App() {
  return (
    <div className="min-h-screen bg-base-200">
      <Header />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
