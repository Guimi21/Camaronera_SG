import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
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

    // Verificar si los campos están vacíos
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

    // Llamar a la función login desde AuthContext
    const result = await login(usuario, password);

    // Si la autenticación es exitosa
    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: "Has iniciado sesión correctamente",
        confirmButtonColor: "#2563eb",
      });
    } else {
      // Si hubo error en el login, mostrar mensaje de error
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

        <label htmlFor="usuario">Usuario</label>
        <input
          id="usuario"
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Ingrese su usuario"
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingrese su contraseña"
          required
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <div className="flex items-center mt-2">
          <input
            id="showPassword"
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          <label htmlFor="showPassword" className="ml-2 text-sm text-gray-700 cursor-pointer">
            Mostrar contraseña
          </label>
        </div>

        <button type="submit" className="mt-1" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Entrar"}
        </button>

        <div className="link-text mt-1">
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
