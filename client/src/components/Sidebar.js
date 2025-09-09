import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import logo from "../assets/logos/logo.png";

export default function Sidebar() {
  const { menus, user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Función que retorna el componente del icono dinámicamente
  const getIcon = (iconName) => {
    if (FaIcons[iconName]) return FaIcons[iconName]; // Busca en FontAwesome
    if (MdIcons[iconName]) return MdIcons[iconName]; // Busca en Material Design
    return null; // Si no existe
  };

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4 flex flex-col">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
   <div className="logoContainer">
  <img src={logo} alt="Logo Camaronera" className="logoPrincipal" />
  <div>
    <h1 className="logoTitulo">Camaronera XYZ</h1>
    <p className="logoSubtitulo">{user.tipo_usuario}</p>
  </div>
</div>

      
      </div>

      {/* Menús */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {menus.map((menu) => {
            const IconComponent = getIcon(menu.icono);
            return (
              <li key={menu.id_menu}>
                <Link
                  to={menu.ruta.startsWith("/layout/") ? menu.ruta : `/${menu.ruta}`}
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    location.pathname === menu.ruta ? "bg-gray-700" : ""
                  }`}
                >
                  {IconComponent && <IconComponent className="mr-2" />}
                  {menu.nombre}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
