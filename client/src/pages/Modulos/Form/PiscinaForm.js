import { useState } from "react";
import { piscinaService } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext"; // Usamos el hook correcto
import Swal from "sweetalert2";
export default function PiscinaForm() {
  const { token } = useAuth(); // Obtenemos token del hook
  const [codigo, setCodigo] = useState("");
  const [hectareas, setHectareas] = useState("");
  const [ubicacion, setUbicacion] = useState("");

  const authFetch = async (url, options = {}) => {
    if (!token) throw new Error("No hay token de autenticación");
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
    return fetch(url, options);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  const data = { codigo, hectareas, ubicacion };

  try {
    const response = await piscinaService.createPiscina(authFetch, data);
    Swal.fire({
      icon: 'success',
      title: '¡Piscina creada!',
      text: `La piscina con código ${codigo} se ha registrado correctamente.`,
      confirmButtonColor: '#2563eb'
    });
    setCodigo("");
    setHectareas("");
    setUbicacion("");
    console.log("Piscina creada:", response);
  } catch (error) {
    console.error("Error creando piscina:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo guardar la piscina. Revisa la consola.',
      confirmButtonColor: '#dc2626'
    });
  }
};
  return (
    <div className="form-container">
      <h2>Registrar Piscina</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Código:</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Hectáreas:</label>
          <input
            type="number"
            step="0.01"
            value={hectareas}
            onChange={(e) => setHectareas(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Ubicación:</label>
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
          />
        </div>
        <button type="submit">Guardar Piscina</button>
      </form>
    </div>
  );
}
