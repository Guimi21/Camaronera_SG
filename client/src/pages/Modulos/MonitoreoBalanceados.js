import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import config from "../../config";
import { useAuth } from "../../context/AuthContext";
import { fetchApi } from "../../services/api";

// Función para obtener la fecha local en formato YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEstadoBadge = (estado) => {
  const isActivo = estado === 'ACTIVO';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
      isActivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isActivo ? 'ACTIVO' : 'INACTIVO'}
    </span>
  );
};

export default function MonitoreoBalanceados() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania, compania } = useAuth(); // Obtener ID de compañía y nombre del usuario autenticado
  const [tiposBalanceado, setTiposBalanceado] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [filters, setFilters] = useState({
    busqueda: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener datos de tipos de balanceado del backend
  const fetchTiposBalanceadoData = async () => {
    // Verificar que el usuario tenga idCompania antes de hacer la petición
    if (!idCompania) {
      setError("No se pudo obtener la información de la compañía del usuario.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const data = await fetchApi(
        `${API_BASE_URL}/module/tipos_balanceado.php?id_compania=${idCompania}`,
        "Error al obtener datos de tipos de balanceado"
      );
      
      setTiposBalanceado(data);
      setFilteredTableData(data);
      setError(null);
      
    } catch (err) {
      console.error("Error fetching tipos balanceado data:", err);
      setError(err.message || "No se pudieron cargar los datos de tipos de balanceado.");
      
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    if (idCompania) {
      fetchTiposBalanceadoData();
    }
  }, [idCompania]);

  // Aplicar filtros cuando cambien los filtros o los datos
  useEffect(() => {
    let filtered = [...tiposBalanceado];

    // Filtrar por búsqueda (nombre, unidad)
    if (filters.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      filtered = filtered.filter(tb => 
        tb.nombre.toLowerCase().includes(searchTerm) ||
        tb.unidad.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredTableData(filtered);
    setCurrentPage(1); // Resetear página al filtrar
  }, [filters, tiposBalanceado]);

  // Manejo de cambios en los filtros
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString || dateString === null || dateString === undefined || dateString === 'null') return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "N/A";
    }
  };

  // Descargar los datos filtrados como Excel
  const handleDownload = () => {
    const dataToExport = filteredTableData.map((tipo, index) => ({
      'No.': index + 1,
      'Nombre': tipo.nombre,
      'Unidad': tipo.unidad,
      'Estado': tipo.estado || 'N/A',
      'Fecha Creación': formatDate(tipo.fecha_creacion),
      'Última Actualización': formatDate(tipo.fecha_actualizacion)
    }));

    // Si no hay datos, crear un array con un objeto vacío para mostrar los encabezados
    const finalData = dataToExport.length > 0 ? dataToExport : [
      { 'No.': '', 'Nombre': '', 'Unidad': '', 'Estado': '', 'Fecha Creación': '', 'Última Actualización': '' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tipos de Balanceado');

    const companiaSlug = compania ? compania.replaceAll(' ', '_').toLowerCase() : 'compania';
    const fileName = `monitoreo_balanceados_${companiaSlug}_${getLocalDateString()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredTableData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">Error: {error}</p>
          <button 
            onClick={fetchTiposBalanceadoData}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-directivo mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Monitoreo de Balanceados</h1>
        <p className="text-gray-600">Panel de control para el muestra de tipos de balanceado de la compañía</p>
      </div>

      {/* Filtros y Tabla */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Filtros */}
        <div className="filtros-tabla p-4 mb-6">
          <h3 className="mb-4">Filtros</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <label htmlFor="busqueda">Búsqueda</label>
              <input
                type="text"
                id="busqueda"
                name="busqueda"
                value={filters.busqueda}
                onChange={handleFilterChange}
                placeholder="Buscar por nombre o unidad..."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Tipos de Balanceado</h2>
        </div>

        {/* Tabla */}
        <div className="table-container mb-4 bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actualización</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    No se encontraron tipos de balanceado
                  </td>
                </tr>
              ) : (
                currentData.map((tipo, index) => (
                  <tr key={tipo.id_tipo_balanceado} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="py-2 px-4 border-b text-sm font-medium text-gray-900">
                      {tipo.nombre}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {tipo.unidad}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {getEstadoBadge(tipo.estado)}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {formatDate(tipo.fecha_creacion)}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {formatDate(tipo.fecha_actualizacion)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Paginación */}
        <div className="table-controls-wrapper mt-4">
          <div className="pagination-wrapper">
            <div className="pagination flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="bg-blue-100 text-blue-800 px-3 py-2 rounded disabled:opacity-50 hover:bg-blue-200 transition"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">Página {currentPage} de {Math.ceil(filteredTableData.length / itemsPerPage)}</span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
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
                className="border rounded p-2 text-sm"
              >
                <option value={5}>5 por página</option>
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </div>

          <div className="action-buttons-wrapper">
            {/* Botón para agregar nuevo tipo de balanceado */}
            <button
              onClick={() => navigate('/layout/form/balanceado')}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors duration-200"
              title="Agregar nuevo tipo de balanceado"
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
              Agregar Balanceado
            </button>

            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Reporte en Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
