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
import MonitoreoPiscinas from "./pages/Modulos/MonitoreoPiscinas";
import MonitoreoBalanceados from "./pages/Modulos/MonitoreoBalanceados";
import MonitoreoCiclos from "./pages/Modulos/MonitoreoCiclos";

// Formularios
import PiscinaForm from "./pages/Modulos/Form/PiscinaForm";
import MuestraForm from "./pages/Modulos/Form/MuestraForm";
import CicloProductivoForm from "./pages/Modulos/Form/CicloProductivoForm";
import BalanceadoForm from "./pages/Modulos/Form/BalanceadoForm";

// Redirección por defecto según tipo_usuario
function DefaultModuleRedirect() {
  const { tipoUsuario } = useAuth();  // Accede a tipoUsuario desde el contexto

  if (!tipoUsuario) return <Navigate to="/login" replace />;

  switch (tipoUsuario) {
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
          {/* Ruta pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Ruta pública de Home */}
          <Route path="/home" element={<Home />} />  {/* Añadida la ruta para Home */}

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
            <Route path="form/muestra" element={<MuestraForm />} />
            <Route path="form/ciclo" element={<CicloProductivoForm />} />
            <Route path="form/balanceado" element={<BalanceadoForm />} />

            {/* Dashboard - Monitoreo */}
            <Route path="dashboard/monitoreo-piscinas" element={<MonitoreoPiscinas />} />
            <Route path="dashboard/monitoreo-balanceados" element={<MonitoreoBalanceados />} />
            <Route path="dashboard/monitoreo-ciclos" element={<MonitoreoCiclos />} />
          </Route>

          {/* Redirección a login si no hay ninguna ruta válida */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
