import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/"); // Redirige al dashboard
    } else {
      setError("Token no válido. Por favor, accedé desde Vex Core.");
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
      <div className="max-w-sm w-full p-6 bg-base-100 rounded shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4">Acceso inválido</h2>
        <p className="text-error text-sm">{error}</p>
      </div>
    </div>
  );
};

export default Login;
