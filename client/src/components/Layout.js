import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "./Header";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Layout() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return null;

  // Función para alternar el estado de la barra lateral en móviles y tabletas
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout h-screen flex flex-col">
      {/* Contenedor general */}
      <div className="mx-auto flex flex-col h-full">
        
        {/* Contenedor principal que contiene el header y el contenido */}
        <div className="main-container flex flex-col md:flex-row flex-1 overflow-hidden px-4 md:px-8 lg:px-16">
         
          {/* Contenedor principal en columna */}
          <div className="vertical-container w-full flex-1">
            {/* Header */}
            <header className="w-full">
              <Header />
              
            
            </header>

            {/* Contenido principal */}
            <main className="flex-1 p-4 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
