import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import logo from "../assets/logos/logo.png";

export default function Sidebar() {
  const { menus, user } = useAuth(); // Get menus and user from context
  const location = useLocation();

  if (!user) return null; // If there's no user, do not render the Sidebar

  // Function that returns the icon component dynamically
  const getIcon = (iconName) => {
    if (FaIcons[iconName]) return FaIcons[iconName]; // Search in FontAwesome
    if (MdIcons[iconName]) return MdIcons[iconName]; // Search in Material Design
    return null; // If it doesn't exist
  };

  return (
    <aside className="sidebar w-full md:w-64 bg-gray-800 text-white p-4">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <div className="logoContainer">
          <img src={logo} alt="Logo Camaronera" className="logoPrincipal" />
          <div>
            <h1 className="logoTitulo">Camaron 360</h1>
            <p className="logoSubtitulo">{user.tipo_usuario}</p> {/* Display user type */}
          </div>
        </div>
      </div>

      {/* Menus */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {menus.map((menu) => {
            const IconComponent = getIcon(menu.icono); // Get the corresponding icon

            return (
              <li key={menu.id_menu}>
                <Link
                  to={menu.ruta.startsWith("/layout/") ? menu.ruta : `/${menu.ruta}`}
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    location.pathname === menu.ruta ? "bg-gray-700" : ""
                  }`}
                >
                  {IconComponent && <IconComponent className="mr-2" />} {/* Display icon if exists */}
                  {menu.nombre} {/* Display menu name */}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
