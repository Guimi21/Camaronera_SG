import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import config from "../../config";
import { useAuth } from "../../context/AuthContext";

export default function Administrador() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idUsuario } = useAuth(); // Obtener ID de usuario del contexto
  const [companias, setCompanias] = useState([]);
  const [filteredCompanias, setFilteredCompanias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [filters, setFilters] = useState({
    busqueda: "",
    estado: "todas"
  });

  // Obtener compañías al montar el componente
  useEffect(() => {
    if (idUsuario) {
      fetchCompanias();
    }
  }, [idUsuario]);

  const fetchCompanias = async () => {
    try {
      setLoading(true);
      
      // Verificar que el usuario tenga idUsuario antes de hacer la petición
      if (!idUsuario) {
        setError("No se pudo obtener la información del usuario.");
        setLoading(false);
        return;
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('id_usuario', idUsuario);
      
      const response = await fetch(`${API_BASE_URL}/module/companias.php?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCompanias(result.data);
        setFilteredCompanias(result.data);
        setError(null);
      } else {
        throw new Error(result.message || "Error al obtener compañías");
      }
      
    } catch (err) {
      console.error("Error fetching companias:", err);
      setError(err.message || "No se pudieron cargar las compañías.");
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros cuando cambien los filtros o los datos
  useEffect(() => {
    let filtered = [...companias];

    // Filtrar por búsqueda (nombre, grupo empresarial, dirección, teléfono)
    if (filters.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      filtered = filtered.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm) ||
        c.grupo_empresarial.toLowerCase().includes(searchTerm) ||
        (c.direccion && c.direccion.toLowerCase().includes(searchTerm)) ||
        (c.telefono && c.telefono.toLowerCase().includes(searchTerm))
      );
    }

    // Filtrar por estado
    if (filters.estado !== "todas") {
      filtered = filtered.filter(c => c.estado === filters.estado);
    }

    setFilteredCompanias(filtered);
    setCurrentPage(1); // Resetear página al filtrar
  }, [filters, companias]);

  // Manejo de cambios en los filtros
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear estado con badge de color
  const getEstadoBadge = (estado) => {
    const isActiva = estado === 'ACTIVA';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        isActiva 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {estado}
      </span>
    );
  };

  // Descargar los datos filtrados como Excel
  const handleDownload = () => {
    // Preparar datos para Excel
    const excelData = filteredCompanias.map((compania, index) => ({
      'No.': index + 1,
      'Nombre': compania.nombre,
      'Grupo Empresarial': compania.grupo_empresarial,
      'Dirección': compania.direccion || 'N/A',
      'Teléfono': compania.telefono || 'N/A',
      'Estado': compania.estado,
      'Fecha Creación': formatDate(compania.fecha_creacion),
      'Última Actualización': formatDate(compania.fecha_actualizacion)
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Compañías');

    const fileName = `reporte_companias_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCompanias = filteredCompanias.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCompanias.length / itemsPerPage);

  return (
    <div className="panel-administrador bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 max-w-full">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2 text-blue-800">Panel Administrador</h1>
        <p className="text-gray-600 mb-6">Gestión de compañías y configuración del sistema.</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3">Cargando compañías...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Filtros */}
            <div className="filtros-tabla mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">Filtros para Tabla Detallada</h3>
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro de búsqueda */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Buscar:</label>
                  <input
                    type="text"
                    name="busqueda"
                    value={filters.busqueda}
                    onChange={handleFilterChange}
                    placeholder="Nombre, grupo, dirección..."
                    className="border rounded p-2 text-sm w-64"
                  />
                </div>

                {/* Filtro de estado */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Estado:</label>
                  <select 
                    name="estado" 
                    value={filters.estado} 
                    onChange={handleFilterChange} 
                    className="border rounded p-2 text-sm"
                  >
                    <option value="todas">Todas</option>
                    <option value="ACTIVA">Activas</option>
                    <option value="INACTIVA">Inactivas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de compañías */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">#</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Nombre</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Grupo Empresarial</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Dirección</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Teléfono</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Estado</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Fecha Creación</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Última Actualización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCompanias.length > 0 ? (
                      currentCompanias.map((compania, index) => (
                        <tr key={compania.id_compania} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-3 px-4 border-b whitespace-nowrap font-semibold text-blue-600">
                            {indexOfFirstItem + index + 1}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap font-medium">
                            {compania.nombre}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {compania.grupo_empresarial}
                          </td>
                          <td className="py-3 px-4 border-b">
                            {compania.direccion || 'N/A'}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {compania.telefono || 'N/A'}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {getEstadoBadge(compania.estado)}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {formatDate(compania.fecha_creacion)}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {formatDate(compania.fecha_actualizacion)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                          No hay compañías disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="pagination flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="bg-blue-100 text-blue-800 px-3 py-2 rounded disabled:opacity-50 hover:bg-blue-200 transition"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <button 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage >= totalPages}
                  className="bg-blue-100 text-blue-800 px-3 py-2 rounded disabled:opacity-50 hover:bg-blue-200 transition"
                >
                  Siguiente
                </button>
                
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded p-2 text-sm ml-2"
                >
                  <option value="5">5 por página</option>
                  <option value="10">10 por página</option>
                  <option value="15">15 por página</option>
                  <option value="25">25 por página</option>
                  <option value="50">50 por página</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Botón para agregar nueva compañía */}
                <button
                  onClick={() => navigate('/layout/form/compania')}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors duration-200"
                  title="Agregar nueva compañía"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Compañía
                </button>

                {/* Botón de descarga */}
                <button 
                  onClick={handleDownload}
                  className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 transition"
                  disabled={loading || filteredCompanias.length === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Reporte en Excel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
