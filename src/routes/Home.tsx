import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const usuario_email = usuario?.email;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000); // ⏱️ 3 segundos de espera

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-6">
      <div className="bg-base-100 p-8 rounded-lg shadow-md text-center max-w-md w-full animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Hola, {usuario_email}!</h1>
        <h2 className="text-xl mb-4">
          Bienvenido a <span className="text-primary font-semibold">VEX CRM</span>
        </h2>
        <p className="text-gray-500">Cargando tu espacio de trabajo...</p>
      </div>
    </div>
  );
}
