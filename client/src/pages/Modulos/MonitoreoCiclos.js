import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import config from "../../config";
import { useAuth } from "../../context/AuthContext";

// Función para obtener la fecha local en formato YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function MonitoreoCiclos() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania, compania } = useAuth(); // Obtener ID de compañía y nombre del usuario autenticado
  const [ciclos, setCiclos] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [filters, setFilters] = useState({
    piscina: "todos",
    tipo_siembra: "todos",
    tipo_alimentacion: "todos",
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

    // Filtrar por piscina
    if (filters.piscina && filters.piscina !== "todos") {
      filtered = filtered.filter(c => String(c.codigo_piscina) === String(filters.piscina));
    }

    // Filtrar por tipo de siembra
    if (filters.tipo_siembra && filters.tipo_siembra !== "todos") {
      filtered = filtered.filter(c => String(c.tipo_siembra) === String(filters.tipo_siembra));
    }

    // Filtrar por tipo de alimentación
    if (filters.tipo_alimentacion && filters.tipo_alimentacion !== "todos") {
      filtered = filtered.filter(c => String(c.nombre_tipo_alimentacion || "") === String(filters.tipo_alimentacion));
    }

    // Filtrar por estado
    if (filters.estado !== "todos") {
      filtered = filtered.filter(c => c.estado === filters.estado);
    }

    setFilteredTableData(filtered);
    setCurrentPage(1); // Resetear página al filtrar
  }, [filters, ciclos]);

  // Helper para obtener valores únicos para selects
  const uniqueValues = (key) => {
    const set = new Set();
    ciclos.forEach(c => {
      let v = c[key];
      if (key === 'tipo_alimentacion') {
        v = c.nombre_tipo_alimentacion;
      }
      if (v !== null && v !== undefined && String(v).trim() !== '') set.add(String(v));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  };

  // Manejo de cambios en los filtros
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString, includeTime = true) => {
    if (!dateString || dateString === null || dateString === undefined || dateString === 'null') return "N/A";
    
    try {
      if (!includeTime) {
        // Para fechas sin hora, extraer solo la parte de fecha para evitar problemas de zona horaria
        const dateStr = String(dateString).trim();
        
        if (!dateStr) return "N/A";
        
        // Extraer solo la parte de fecha (YYYY-MM-DD)
        let datePart = dateStr.split('T')[0]; // Maneja formato ISO
        if (datePart === dateStr && dateStr.includes(' ')) {
          datePart = dateStr.split(' ')[0]; // Maneja formato con espacio
        }
        
        const [year, month, day] = datePart.split('-');
        
        // Validar que los valores sean válidos
        if (!year || !month || !day || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
          return "N/A";
        }
        
        // Crear fecha sin conversión de zona horaria
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day));
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } else {
        // Para fechas con hora, usar el método estándar
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "N/A";
    }
  };

  // Descargar los datos filtrados como Excel
  const handleDownload = () => {
    const dataToExport = filteredTableData.map((ciclo, index) => ({
      'No.': index + 1,
      'Piscina': ciclo.codigo_piscina,
      'Fecha Siembra': formatDate(ciclo.fecha_siembra, false),
      'Fecha Cosecha': formatDate(ciclo.fecha_cosecha, false),
      'Cantidad Siembra': ciclo.cantidad_siembra,
      'Densidad': ciclo.densidad,
      'Tipo Siembra': ciclo.tipo_siembra,
      'Tipo Alimentación': ciclo.nombre_tipo_alimentacion || 'N/A',
      'Cosecha en libras': ciclo.biomasa_cosecha || 'N/A',
      'Libras por Hectárea': ciclo.libras_por_hectarea || 'N/A',
      'Promedio Incremento Peso': ciclo.promedio_incremento_peso || 'N/A',
      'Informe PDF': ciclo.ruta_pdf ? ciclo.ruta_pdf.split('/').pop() : 'N/A',
      'Estado': ciclo.estado,
      'Última Actualización': formatDate(ciclo.fecha_actualizacion, true)
    }));

    // Si no hay datos, crear un array con un objeto vacío para mostrar los encabezados
    const finalData = dataToExport.length > 0 ? dataToExport : [
      { 'No.': '', 'Piscina': '', 'Fecha Siembra': '', 'Fecha Cosecha': '', 'Cantidad Siembra': '', 'Densidad': '', 'Tipo Siembra': '', 'Tipo Alimentación': '', 'Cosecha en libras': '', 'Libras por Hectárea': '', 'Promedio Incremento Peso': '', 'Estado': '', 'Última Actualización': '' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ciclos Productivos');

    const companiaSlug = compania ? compania.replaceAll(' ', '_').toLowerCase() : 'compania';
    const fileName = `monitoreo_ciclos_${companiaSlug}_${getLocalDateString()}.xlsx`;
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
        {/* Filtros */}
        <div className="filtros-tabla p-4 mb-6">
          <h3 className="mb-4">Filtros</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <label htmlFor="piscina">Piscina</label>
              <select
                id="piscina"
                name="piscina"
                value={filters.piscina}
                onChange={handleFilterChange}
              >
                <option value="todos">Todas las piscinas</option>
                {uniqueValues('codigo_piscina').map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="tipo_siembra">Tipo Siembra</label>
              <select
                id="tipo_siembra"
                name="tipo_siembra"
                value={filters.tipo_siembra}
                onChange={handleFilterChange}
              >
                <option value="todos">Todos los tipos</option>
                {uniqueValues('tipo_siembra').map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="tipo_alimentacion">Tipo Alimentación</label>
              <select
                id="tipo_alimentacion"
                name="tipo_alimentacion"
                value={filters.tipo_alimentacion}
                onChange={handleFilterChange}
              >
                <option value="todos">Todos los tipos</option>
                {uniqueValues('tipo_alimentacion').map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={filters.estado}
                onChange={handleFilterChange}
              >
                <option value="todos">Todos los estados</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Ciclos Productivos</h2>
        </div>

        {/* Tabla */}
        <div className="table-container mb-4 bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Piscina</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Siembra</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Cosecha</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Siembra</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Densidad</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Siembra</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Alimentación</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cosecha en libras</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libras por Hectárea</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio Inc. Peso</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Informe PDF</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actualización</th>
                <th className="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="15" className="py-4 text-center text-gray-500">
                    No se encontraron ciclos productivos
                  </td>
                </tr>
              ) : (
                currentData.map((ciclo, index) => (
                  <tr key={ciclo.id_ciclo} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.codigo_piscina}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {formatDate(ciclo.fecha_siembra, false)}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {formatDate(ciclo.fecha_cosecha, false)}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.cantidad_siembra ? ciclo.cantidad_siembra : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.densidad}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.tipo_siembra}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.nombre_tipo_alimentacion ? ciclo.nombre_tipo_alimentacion : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.biomasa_cosecha ? ciclo.biomasa_cosecha : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.libras_por_hectarea || 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {ciclo.promedio_incremento_peso || 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-center">
                      {ciclo.ruta_pdf ? (
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `${API_BASE_URL}/${ciclo.ruta_pdf}`;
                            link.download = ciclo.ruta_pdf.split('/').pop();
                            link.click();
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200 inline-flex items-center gap-1"
                          title="Descargar informe PDF"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Descargar
                        </button>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
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
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {formatDate(ciclo.fecha_actualizacion, true)}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        {ciclo.estado === 'FINALIZADO' ? (
                          <button
                            onClick={() => navigate(`/layout/form/consultar-ciclo/${ciclo.id_ciclo}`)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                            title="Consultar ciclo productivo"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Consultar
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/layout/form/editar-ciclo/${ciclo.id_ciclo}`)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1"
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
                        )}
                      </div>
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
