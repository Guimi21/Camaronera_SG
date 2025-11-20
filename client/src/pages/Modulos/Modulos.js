import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import config from "../../config";

// Función para obtener la fecha local en formato YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Modulos() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const [modulos, setModulos] = useState([]);
  const [filteredModulos, setFilteredModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [filters, setFilters] = useState({
    busqueda: ""
  });

  // Obtener módulos al montar el componente
  useEffect(() => {
    fetchModulos();
  }, []);

  const fetchModulos = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/module/modulos.php`, {
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
        setModulos(result.data);
        setFilteredModulos(result.data);
        setError(null);
      } else {
        throw new Error(result.message || "Error al obtener módulos");
      }

    } catch (err) {
      console.error("Error fetching modulos:", err);
      setError(err.message || "No se pudieron cargar los módulos.");
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros cuando cambien los filtros o los datos
  useEffect(() => {
    let filtered = [...modulos];

    // Filtrar por búsqueda (nombre, descripción)
    if (filters.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      filtered = filtered.filter(m =>
        m.nombre.toLowerCase().includes(searchTerm) ||
        (m.descripcion && m.descripcion.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredModulos(filtered);
    setCurrentPage(1); // Resetear página al filtrar
  }, [filters, modulos]);

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

  // Descargar los datos filtrados como Excel
  const handleDownload = () => {
    // Preparar datos para Excel
    const excelData = filteredModulos.map((modulo, index) => ({
      'No.': index + 1,
      'Nombre': modulo.nombre,
      'Descripción': modulo.descripcion || 'N/A',
      'Fecha Creación': formatDate(modulo.fecha_creacion),
      'Última Actualización': formatDate(modulo.fecha_actualizacion)
    }));

    // Si no hay datos, crear un array con un objeto vacío para mostrar los encabezados
    const finalData = excelData.length > 0 ? excelData : [
      { 'No.': '', 'Nombre': '', 'Descripción': '', 'Fecha Creación': '', 'Última Actualización': '' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Módulos');

    const fileName = `reporte_modulos_${getLocalDateString()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentModulos = filteredModulos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredModulos.length / itemsPerPage);

  return (
    <div className="panel-administrador bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 max-w-full">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2 text-blue-800">Gestión de Módulos</h1>
        <p className="text-gray-600 mb-6">Monitoreo y administración de módulos del sitio web.</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3">Cargando módulos...</span>
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
                    placeholder="Nombre, descripción..."
                    className="border rounded p-2 text-sm w-64"
                  />
                </div>
              </div>
            </div>

            {/* Tabla de módulos */}
            <div className="table-container mb-4 bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">#</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Nombre</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Descripción</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Fecha Creación</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Última Actualización</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentModulos.length > 0 ? (
                      currentModulos.map((modulo, index) => (
                        <tr key={modulo.id_modulo} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-3 px-4 border-b whitespace-nowrap font-semibold text-blue-600">
                            {indexOfFirstItem + index + 1}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap font-medium">
                            {modulo.nombre}
                          </td>
                          <td className="py-3 px-4 border-b">
                            {modulo.descripcion || 'N/A'}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {formatDate(modulo.fecha_creacion)}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {formatDate(modulo.fecha_actualizacion)}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/layout/form/modulo/${modulo.id_modulo}`)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors duration-200"
                              title="Editar módulo"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                          No hay módulos disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            <div className="table-controls-wrapper">
              <div className="pagination-wrapper">
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
              </div>

              <div className="action-buttons-wrapper">
                {/* Botón para crear nuevo módulo */}
                <button
                  onClick={() => navigate('/layout/form/modulo')}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Módulo
                </button>

                {/* Botón de descarga */}
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
          </>
        )}
      </div>
    </div>
  );
}
