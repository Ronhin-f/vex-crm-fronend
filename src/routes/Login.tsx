import { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("admin@vex.com");
  const [password, setPassword] = useState("VectorKaiju2025!");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/login", { email, password });
      const token = res.data.token;
      login(token); // ✅ usamos el AuthContext
      navigate("/");
    } catch (err: any) {
      console.error("❌ Error al iniciar sesión", err);
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
      <div className="max-w-sm w-full p-6 bg-base-100 rounded shadow-md">
        <h2 className="text-2xl font-bold mb-4">Login de Desarrollo Local</h2>
        <p className="text-sm text-warning mb-2">
          ⚠️ Este login existe solo para pruebas locales. En producción se usa Vex Core.
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full"
            required
          />
          <input
            type="password"
            placeholder="Clave"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered w-full"
            required
          />
          {error && <div className="text-error text-sm">{error}</div>}
          <button className="btn btn-primary w-full">Entrar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
