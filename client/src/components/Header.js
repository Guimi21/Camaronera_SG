import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt, FaBars } from "react-icons/fa";

export default function Header() {
  const { user, logout } = useAuth(); // Accedemos a 'user' y 'logout' desde el contexto
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Función para manejar el logout y redirigir al login
  const handleLogout = () => {
    logout(); // Llamada para hacer logout
    navigate("/login"); // Redirigir a la página de login
  };

  // Función para manejar la apertura y cierre del menú
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Si no hay usuario, no se renderiza el header
  if (!user) return null;

  return (
    <header className="bg-dark text-white px-4 py-3 shadow-sm flex justify-between items-center">
      <div className="flex items-center">
        {/* Icono de usuario */}
        <FaUserCircle className="text-2xl text-gray-300" />
        <span className="ml-2 hidden sm:inline">Hola, {user}</span>
      </div>

      {/* Botón de cerrar sesión */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
      >
        <FaSignOutAlt />
        Cerrar sesión
      </button>

    
    </header>
  );
}
