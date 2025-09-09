import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Layout from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";

// Módulos
import Administrador from "./pages/Modulos/Administrador";
import Digitador from "./pages/Modulos/Digitador";
import Directivo from "./pages/Modulos/Directivo";

// Formularios
import PiscinaForm from "./pages/Modulos/Form/PiscinaForm";
import CicloProductivoForm from "./pages/Modulos/Form/CicloProductivoForm";

// Redirección por defecto según tipo_usuario
function DefaultModuleRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.tipo_usuario) {
    case "Administrador":
      return <Navigate to="administrador" replace />;
    case "Digitador":
      return <Navigate to="digitador" replace />;
    case "Director":
      return <Navigate to="directivo" replace />;
    default:
      return <p>No tiene módulo asignado</p>;
  }
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas con Layout */}
          <Route
            path="/layout/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Por defecto carga el módulo según el tipo de usuario */}
            <Route index element={<DefaultModuleRedirect />} />

            {/* Módulos */}
            <Route path="administrador" element={<Administrador />} />
            <Route path="digitador" element={<Digitador />} />
            <Route path="directivo" element={<Directivo />} />

            {/* Formularios */}
            <Route path="form/piscina" element={<PiscinaForm />} />
            <Route path="form/ciclo" element={<CicloProductivoForm />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
