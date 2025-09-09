import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // íconos
import Swal from "sweetalert2";
import "../App.css"; // importa los estilos

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ✅ Redirección segura usando useEffect
useEffect(() => {
  if (isAuthenticated) {
    navigate("/layout");
  }
}, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!usuario || !password) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor complete todos los campos",
        confirmButtonColor: "#f59e0b",
      });
      setLoading(false);
      return;
    }

    const result = await login(usuario, password);

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: "Has iniciado sesión correctamente",
        confirmButtonColor: "#2563eb",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: result.error || "Usuario o contraseña incorrectos",
        confirmButtonColor: "#dc2626",
      });
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Iniciar Sesión</h2>

        <label>Usuario</label>
        <input
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Ingrese su usuario"
          required
        />

        <label>Contraseña</label>
        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingrese su contraseña"
            required
            className="w-full pr-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Entrar"}
        </button>

        <div className="link-text">
          <p>
            ¿No tienes cuenta?{" "}
            <button type="button" onClick={() => navigate("/home")}>
              Volver al inicio
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
