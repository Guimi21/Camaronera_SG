import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt, FaBars, FaBuilding } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import logo from "../assets/logos/logo.png";

export default function Header() {
  const { user, nombre, logout, grupoEmpresarial, companias, compania, idCompania, cambiarCompania, menus, perfilActivo } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para manejar el menú desplegable
  const [isCatalogoOpen, setIsCatalogoOpen] = useState(false); // Estado para manejar el menú desplegable

  // Función para manejar el logout y redirigir al login
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Función para manejar la apertura y cierre del menú
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Función para manejar la apertura y cierre del menú de catálogo
  const toggleCatalogo = () => {
    setIsCatalogoOpen(!isCatalogoOpen);
  }

  // Función para manejar la apertura/cierre de los menús en el acordeón
  const toggleMenu = (menuRuta) => {
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
      <div className="mt-2 flex items-center space-x-4">
        <div className="logoContainer">
          <img src={logo} alt="Logo Camaronera" className="logoPrincipal" />
          <div>
            <h1 className="logoTitulo"></h1>
            <div className="logoText">
              <p className="logoTitulo text-lg">{grupoEmpresarial || "Súper Admin"}</p>
              
              {/* Selector de compañía - solo se muestra si hay compañías */}
              {companias && companias.length > 0 ? (
                companias.length > 1 ? (
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
                )
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Botón de abrir/cerrar menú hamburguesa */}
      <button
        className="ml-1 text-2xl text-gray-300 md:hidden"
        onClick={() => {
          toggleSidebar();
          setIsCatalogoOpen(false);
        }}
      >
        <FaBars />
      </button>

      {/* Menú de navegación acordeón */}
      <div className="mt-auto flex items-center gap-4">
        <nav className={`fixed left-0 top-16 w-full bg-gray-800 md:static md:bg-transparent flex-1 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 ${isSidebarOpen ? "block" : "hidden"} md:block`}>
          {/* Mostrar menú Catálogo solo para Administrador */}
          {perfilActivo === "Administrador" && (
            <div className="w-full md:w-auto">
              <button
                className={`header-button flex items-center p-2 rounded hover:bg-gray-700 w-full md:w-auto ${location.pathname === "/layout/dashboard/companias" ? "bg-gray-700" : ""}`}
                onClick={toggleCatalogo}
              >
                <FaIcons.FaList className="mr-2" />
                Catálogo
              </button>
            </div>
          )}

          {menus.map((menu) => {
            // Filtrar menús para Administrador: ocultar "Usuarios" y "Compañías", mostrar "Catálogo"
            if (perfilActivo === "Administrador") {
              if (menu.nombre === "Usuarios" || menu.nombre === "Compañías") {
                return null; // No renderizar estos menús
              }
            }
            
            const IconComponent = getIcon(menu.icono);

            return (
              <div key={menu.id_menu} className="w-full md:w-auto">
                <button
                  className={`header-button flex items-center p-2 rounded hover:bg-gray-700 w-full md:w-auto ${location.pathname === menu.ruta ? "bg-gray-700" : ""}`}
                  onClick={() => {
                    toggleMenu(menu.ruta); // Pasar solo la ruta
                    toggleSidebar(); // Cerrar el menú hamburguesa al seleccionar una opción
                    setIsCatalogoOpen(false); // Cerrar el menú catálogo al seleccionar una opción
                  }}
                >
                  {IconComponent && <IconComponent className="mr-2" />}
                  {menu.nombre}
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Sección adicional de opciones para Administrador */}
      {isCatalogoOpen && (
        <div className="mt-auto hidden md:flex items-center gap-4">
          {menus.map((menu) => {
            // Mostrar solo "Usuarios" y "Compañías" para Administrador
            if (menu.nombre !== "Usuarios" && menu.nombre !== "Compañías") {
              return null;
            }
            
            const IconComponent = getIcon(menu.icono);

            return (
              <button
                key={menu.id_menu}
                className={`header-button flex items-center p-2 rounded hover:bg-gray-700 ${location.pathname === menu.ruta ? "bg-gray-700" : ""}`}
                onClick={() => {
                  toggleMenu(menu.ruta);
                  toggleCatalogo();
                  toggleSidebar();
                }}
                title={menu.nombre}
              >
                {IconComponent && <IconComponent className="mr-2" />}
                {menu.nombre}
              </button>
            );
          })}
        </div>
      )}

      {/* Icono de usuario y botón de logout alineado a la derecha */}
      <div className="header-user flex items-center space-x-4 ml-auto">
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
