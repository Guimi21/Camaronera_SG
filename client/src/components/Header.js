import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

export default function Header() {
  const { user, logout } = useAuth(); // Accedemos a 'user', 'tipoUsuario' y 'logout' desde el contexto
  const navigate = useNavigate();

  // Función para manejar el logout y redirigir al login
  const handleLogout = () => {
    logout(); // Llamada para hacer logout
    navigate("/login"); // Redirigir a la página de login
  };

  // Si no hay usuario, no se renderiza el header
  if (!user) return null;

  return (
    <header className="flex items-center bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white px-6 py-4 shadow-lg">
      {/* Usuario */}
      <div className="flex items-center space-x-2">
        <FaUserCircle className="text-2xl text-gray-300" />
        <span className="text-sm font-medium">Hola, {user}</span> {/* Mostrar el username del usuario */}
      </div>

  
      {/* Botón de cerrar sesión alineado a la derecha */}
      <button
        onClick={handleLogout}
        className="ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
      >
        <FaSignOutAlt />
        Cerrar sesión
      </button>
    </header>
  );
}
