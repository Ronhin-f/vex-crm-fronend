import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { usuario_email } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-6">
      <div className="bg-base-100 p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">Hola, {usuario_email}!</h1>
        <h2 className="text-xl mb-4">Bienvenido a <span className="text-primary font-semibold">VEX CRM</span></h2>
        <p className="text-gray-500 mb-6">Acá podés gestionar tus clientes, tareas y compras desde un solo lugar.</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn btn-primary"
          >
            Ir al Dashboard
          </button>
          <button
            onClick={() => navigate("/clientes")}
            className="btn btn-outline"
          >
            Ver Clientes
          </button>
        </div>
      </div>
    </div>
  );
}
