import { useNavigate } from "react-router-dom";

export default function Administrador() {
  const navigate = useNavigate();

  const handleNavigateToMonitoreo = () => {
    navigate("/layout/dashboard/monitoreo-piscinas");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Panel Administrador</h1>
      <p className="mb-6">Opciones de configuración y gestión de usuarios.</p>
      
      {/* Botón temporal para acceder al monitoreo de piscinas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Monitoreo</h2>
        <button
          onClick={handleNavigateToMonitoreo}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Ir a Monitoreo de Piscinas
        </button>
      </div>
    </div>
  );
}
