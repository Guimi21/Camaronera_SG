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
import Usuarios from "./pages/Modulos/Usuarios";

// Formularios
import PiscinaForm from "./pages/Modulos/Form/PiscinaForm";
import MuestraForm from "./pages/Modulos/Form/MuestraForm";
import CicloProductivoForm from "./pages/Modulos/Form/CicloProductivoForm";
import EditarCicloProductivoForm from "./pages/Modulos/Form/EditarCicloProductivoForm";
import ConsultarCicloProductivoForm from "./pages/Modulos/Form/ConsultarCicloProductivoForm";
import BalanceadoForm from "./pages/Modulos/Form/BalanceadoForm";
import CompaniaForm from "./pages/Modulos/Form/CompaniaForm";
import UsuarioForm from "./pages/Modulos/Form/UsuarioForm";

// Redirección por defecto según perfil activo
function DefaultModuleRedirect() {
  const { perfilActivo } = useAuth();  // Accede a perfilActivo desde el contexto

  if (!perfilActivo) return <Navigate to="/login" replace />;

  switch (perfilActivo) {
    case "Administrador":
      return <Navigate to="dashboard/companias" replace />;
    case "Digitador":
      return <Navigate to="digitador" replace />;
    case "Directivo":
      return <Navigate to="dashboard/reporte" replace />;
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
            <Route path="dashboard/companias" element={<Administrador />} />
            <Route path="dashboard/usuarios" element={<Usuarios />} />
            <Route path="digitador" element={<Digitador />} />
            <Route path="dashboard/reporte" element={<Directivo />} />

            {/* Formularios */}
            <Route path="form/piscina" element={<PiscinaForm />} />
            <Route path="form/muestra" element={<MuestraForm />} />
            <Route path="form/ciclo" element={<CicloProductivoForm />} />
            <Route path="form/editar-ciclo/:id" element={<EditarCicloProductivoForm />} />
            <Route path="form/consultar-ciclo/:id" element={<ConsultarCicloProductivoForm />} />
            <Route path="form/balanceado" element={<BalanceadoForm />} />
            <Route path="form/compania" element={<CompaniaForm />} />
            <Route path="form/usuario" element={<UsuarioForm />} />

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
