import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="layout">
      <aside className="sidebar">
        <Sidebar />
      </aside>

      <div className="main-container">
        <header>
          <Header />
        </header>

        <main className="p-4">
          {/* Aquí se cargan las páginas según la ruta */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
