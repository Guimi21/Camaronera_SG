import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import config from "../../config";
import { useAuth } from "../../context/AuthContext";

export default function MonitoreoCiclos() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania } = useAuth(); // Obtener ID de compañía del usuario autenticado
  const [ciclos, setCiclos] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [filters, setFilters] = useState({
    busqueda: "",
    estado: "todos"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener datos de ciclos productivos del backend
  const fetchCiclosData = async () => {
    // Verificar que el usuario tenga idCompania antes de hacer la petición
    if (!idCompania) {
      setError("No se pudo obtener la información de la compañía del usuario.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      queryParams.append('id_compania', idCompania);
      
      const response = await fetch(`${API_BASE_URL}/module/ciclosproductivos.php?${queryParams.toString()}`, {
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
        setCiclos(result.data);
        setFilteredTableData(result.data);
        setError(null);
      } else {
        throw new Error(result.message || "Error al obtener datos de ciclos productivos");
      }
      
    } catch (err) {
      console.error("Error fetching ciclos data:", err);
      setError(err.message || "No se pudieron cargar los datos de ciclos productivos.");
      
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    if (idCompania) {
      fetchCiclosData();
    }
  }, [idCompania]);

  // Aplicar filtros cuando cambien los filtros o los datos
  useEffect(() => {
    let filtered = [...ciclos];

    // Filtrar por búsqueda (código de piscina, tipo de siembra)
    if (filters.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      filtered = filtered.filter(c => 
        c.codigo_piscina.toLowerCase().includes(searchTerm) ||
        c.tipo_siembra.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrar por estado
    if (filters.estado !== "todos") {
      filtered = filtered.filter(c => c.estado === filters.estado);
    }

    setFilteredTableData(filtered);
    setCurrentPage(1); // Resetear página al filtrar
  }, [filters, ciclos]);

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
    if (!dateString) return "N/A";
    // Dividir la fecha en partes (YYYY-MM-DD) para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-');
    // Crear fecha sin conversión de zona horaria
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES');
  };

  // Descargar los datos filtrados como Excel
  const handleDownload = () => {
    const dataToExport = filteredTableData.map((ciclo, index) => ({
      'No.': index + 1,
      'Piscina': ciclo.codigo_piscina,
      'Fecha Siembra': formatDate(ciclo.fecha_siembra),
      'Fecha Cosecha': formatDate(ciclo.fecha_cosecha),
      'Cantidad Siembra': ciclo.cantidad_siembra,
      'Densidad': ciclo.densidad,
      'Tipo Siembra': ciclo.tipo_siembra,
      'Estado': ciclo.estado
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ciclos Productivos');

    const fileName = `monitoreo_ciclos_${new Date().toISOString().split('T')[0]}.xlsx`;
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
            onClick={fetchCiclosData}
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Monitoreo de Ciclos Productivos</h1>
        <p className="text-gray-600">Panel de control para la muestra de ciclos productivos de la compañía</p>
      </div>

      {/* Filtros y Tabla */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Ciclos Productivos</h2>
          
          {/* Filtros */}
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <input
              type="text"
              name="busqueda"
              value={filters.busqueda}
              onChange={handleFilterChange}
              placeholder="Buscar por piscina o tipo siembra..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="estado"
              value={filters.estado}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="EN_CURSO">En Curso</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Piscina</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Siembra</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Cosecha</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Siembra</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Densidad</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Siembra</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-4 text-center text-gray-500">
                    No se encontraron ciclos productivos
                  </td>
                </tr>
              ) : (
                currentData.map((ciclo, index) => (
                  <tr key={ciclo.id_ciclo} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="py-2 px-4 border-b text-sm font-medium text-gray-900">
                      {ciclo.codigo_piscina}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {formatDate(ciclo.fecha_siembra)}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {formatDate(ciclo.fecha_cosecha)}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.cantidad_siembra ? ciclo.cantidad_siembra.toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.densidad}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.tipo_siembra}
                    </td>
                    <td className="py-2 px-4 border-b text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        ciclo.estado === 'EN_CURSO' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ciclo.estado === 'EN_CURSO' ? 'En Curso' : 'Finalizado'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-center">
                      <button
                        onClick={() => navigate(`/layout/form/editar-ciclo/${ciclo.id_ciclo}`)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1 mx-auto"
                        title="Editar ciclo productivo"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-4 w-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
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

          <div className="flex gap-2">
            {/* Botón para agregar nuevo ciclo productivo */}
            <button
              onClick={() => navigate('/layout/form/ciclo')}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors duration-200"
              title="Agregar nuevo ciclo productivo"
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
              Agregar Ciclo
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
