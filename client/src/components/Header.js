import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt, FaBars, FaBuilding } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import logo from "../assets/logos/logo.png";

export default function Header() {
  const { user, nombre, logout, grupoEmpresarial, companias, compania, idCompania, cambiarCompania, menus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para manejar el menú desplegable en móviles
  const [activeMenu, setActiveMenu] = useState(null); // Estado para controlar qué menú está abierto en el acordeón

  // Función para manejar el logout y redirigir al login
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Función para manejar la apertura y cierre del menú en móviles
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Función para manejar la apertura/cierre de los menús en el acordeón
  const toggleMenu = (menuId, menuRuta) => {
    setActiveMenu(activeMenu === menuId ? null : menuId); // Si el menú ya está abierto, lo cierra
    menuRuta = menuRuta.startsWith("/layout/") ? menuRuta : `/layout${menuRuta}`;
    navigate(menuRuta); // Navega a la ruta del menú
  };

  // Función que devuelve el componente de icono de forma dinámica
  const getIcon = (iconName) => {
    if (FaIcons[iconName]) return FaIcons[iconName];
    if (MdIcons[iconName]) return MdIcons[iconName];
    return null;
  };

  // Función para manejar el cambio de compañía
  const handleCompaniaChange = (e) => {
    const nuevaCompaniaId = parseInt(e.target.value);
    cambiarCompania(nuevaCompaniaId);
  };

  // Si no hay usuario, no se renderiza el header
  if (!user) return null;

  return (
    <header className="bg-dark text-white px-4 py-3 shadow-sm flex justify-between items-center">
      {/* Logo y texto alineados a la izquierda */}
      <div className="flex items-center space-x-4">
        <div className="logoContainer">
          <img src={logo} alt="Logo Camaronera" className="logoPrincipal" />
          <div>
            <h1 className="logoTitulo"></h1>
            <div className="logoText">
              <p className="logoTitulo text-lg">{grupoEmpresarial || "N/A"}</p>
              
              {/* Selector de compañía */}
              {companias && companias.length > 1 ? (
                <div className="flex items-center gap-2 mt-1">
                  <FaBuilding className="text-gray-400 text-xs" />
                  <select
                    value={idCompania || ''}
                    onChange={handleCompaniaChange}
                    className="compania-selector text-sm bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Seleccionar compañía"
                  >
                    {companias.map((comp) => (
                      <option key={comp.id_compania} value={comp.id_compania}>
                        {comp.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <FaBuilding className="text-gray-400 text-xs" />
                  <p className="logoTitulo text-sm">{compania || "N/A"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botón de abrir/cerrar menú (para móviles) */}
      <button onClick={toggleSidebar} className="text-2xl text-gray-300 md:hidden">
        <FaBars />
      </button>

      {/* Menú de navegación acordeón */}
      <nav className={`flex-1 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 ${isSidebarOpen ? "block" : "hidden"} md:block`}>
        {menus.map((menu) => {
          const IconComponent = getIcon(menu.icono);

          return (
            <div key={menu.id_menu} className="w-full">
              <button
                className={`header-button flex items-center p-2 rounded hover:bg-gray-700 ${location.pathname === menu.ruta ? "bg-gray-700" : ""}`}
                onClick={() => toggleMenu(menu.id_menu, menu.ruta)} // Abrir/cerrar el menú acordeón
              >
                {IconComponent && <IconComponent className="mr-2" />}
                {menu.nombre}
              </button>

              {/* Submenú acordeón */}
              {activeMenu === menu.id_menu && (
                <div className="pl-6">
                  {menu.submenus?.map((submenu) => (
                    <Link
                      key={submenu.id}
                      to={submenu.ruta.startsWith("/layout/") ? submenu.ruta : `/${submenu.ruta}`}
                      className={`block py-2 px-4 text-gray-300 hover:bg-gray-700 ${location.pathname === submenu.ruta ? "bg-gray-700" : ""}`}
                    >
                      {submenu.nombre}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Icono de usuario y botón de logout alineado a la derecha */}
      <div className="flex items-center space-x-4 ml-auto">
        <FaUserCircle className="text-2xl text-gray-300" />
        <span className="ml-2 hidden sm:inline">Hola, {nombre}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          <FaSignOutAlt />
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
