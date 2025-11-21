import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { Bar, Doughnut } from 'react-chartjs-2';
import * as XLSX from "xlsx";
import config from "../../config";
import { useAuth } from "../../context/AuthContext";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Función para obtener la fecha local en formato YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEstadoBadge = (estado) => {
  const isActiva = estado === 'ACTIVA';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
      isActiva ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isActiva ? 'ACTIVA' : 'INACTIVA'}
    </span>
  );
};

export default function MonitoreoPiscinas() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania, compania } = useAuth(); // Obtener ID de compañía y nombre del usuario autenticado
  const [piscinas, setPiscinas] = useState([]);
  const [filteredTableData, setfilteredTableData] = useState([]);
  const [filters, setFilters] = useState({
    busqueda: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener datos de piscinas del backend
  const fetchPiscinasData = async () => {
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
      
      const response = await fetch(`${API_BASE_URL}/module/piscinas.php?${queryParams.toString()}`, {
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
        setPiscinas(result.data);
        setfilteredTableData(result.data);
        setError(null);
      } else {
        throw new Error(result.message || "Error al obtener datos de piscinas");
      }
      
    } catch (err) {
      console.error("Error fetching piscinas data:", err);
      setError(err.message || "No se pudieron cargar los datos de piscinas.");
      
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    if (idCompania) {
      fetchPiscinasData();
    }
  }, [idCompania]);

  // Aplicar filtros cuando cambien los filtros o los datos
  useEffect(() => {
    let filtered = [...piscinas];

    // Filtrar por búsqueda (código, ubicación)
    if (filters.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      filtered = filtered.filter(p => 
        p.codigo.toLowerCase().includes(searchTerm) ||
        p.ubicacion.toLowerCase().includes(searchTerm)
      );
    }

    setfilteredTableData(filtered);
    setCurrentPage(1); // Resetear página al filtrar
  }, [filters, piscinas]);

  // Cálculos estadísticos
  const totalPiscinas = piscinas.length;
  const hectareasTotal = piscinas.reduce((total, p) => total + p.hectareas, 0);
  const promedioHectareasPorPiscina = totalPiscinas > 0 ? 
    (hectareasTotal / totalPiscinas).toFixed(2) : 0;

  // Configuración de gráficos
  const hectareasPorPiscinaData = {
    labels: piscinas.map(p => p.codigo),
    datasets: [
      {
        label: 'Hectáreas',
        data: piscinas.map(p => p.hectareas),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Distribución de tamaños de piscinas
  const distribucionTamanoData = {
    labels: ['Pequeñas (<5 ha)', 'Medianas (5-15 ha)', 'Grandes (>15 ha)'],
    datasets: [
      {
        data: [
          piscinas.filter(p => p.hectareas < 5).length,
          piscinas.filter(p => p.hectareas >= 5 && p.hectareas <= 15).length,
          piscinas.filter(p => p.hectareas > 15).length
        ],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)'],
        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(59, 130, 246, 1)', 'rgba(168, 85, 247, 1)'],
        borderWidth: 1,
      }
    ]
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
    const dataToExport = filteredTableData.map((piscina, index) => ({
      'No.': index + 1,
      'Código': piscina.codigo,
      'Hectáreas': piscina.hectareas,
      'Estado': piscina.estado || 'N/A',
      'Ubicación': piscina.ubicacion,
      'Fecha Creación': formatDate(piscina.fecha_creacion),
      'Última Actualización': formatDate(piscina.fecha_actualizacion)
    }));

    // Si no hay datos, crear un array con un objeto vacío para mostrar los encabezados
    const finalData = dataToExport.length > 0 ? dataToExport : [
      { 'No.': '', 'Código': '', 'Hectáreas': '', 'Estado': '', 'Ubicación': '', 'Fecha Creación': '', 'Última Actualización': '' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Piscinas');

    const companiaSlug = compania ? compania.replace(/\s+/g, '_').toLowerCase() : 'compania';
    const fileName = `monitoreo_piscinas_${companiaSlug}_${getLocalDateString()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredTableData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

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
            onClick={fetchPiscinasData}
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Monitoreo de Piscinas</h1>
        <p className="text-gray-600">Panel de control para el muestra de piscinas de la compañía</p>
      </div>

      {/* 
      Estadísticas Generales
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total de Piscinas</h3>
          <p className="text-3xl font-bold text-blue-600">{totalPiscinas}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Hectáreas Totales</h3>
          <p className="text-3xl font-bold text-purple-600">{hectareasTotal.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Promedio Hectáreas</h3>
          <p className="text-3xl font-bold text-orange-600">{promedioHectareasPorPiscina}</p>
        </div>
      </div>

      Gráficos
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="grafico-container bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Hectáreas por Piscina</h3>
          <Bar 
            data={hectareasPorPiscinaData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Hectáreas'
                  }
                }
              }
            }}
          />
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Distribución por Tamaño</h3>
          <Doughnut 
            data={distribucionTamanoData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                }
              }
            }}
          />
        </div>
      </div>
      */}

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
                placeholder="Buscar por código o ubicación..."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Piscinas</h2>
        </div>

        {/* Tabla */}
        <div className="table-container mb-4 bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hectáreas</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actualización</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-gray-500">
                    No se encontraron piscinas
                  </td>
                </tr>
              ) : (
                currentData.map((piscina, index) => (
                  <tr key={piscina.id_piscina} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="py-2 px-4 border-b text-sm font-medium text-gray-900">
                      {piscina.codigo}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {piscina.hectareas}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {getEstadoBadge(piscina.estado)}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {piscina.ubicacion}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {formatDate(piscina.fecha_creacion)}
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                      {formatDate(piscina.fecha_actualizacion)}
                    </td>
                  </tr>
                ))
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
            {/* Botón para agregar nueva piscina */}
            <button
              onClick={() => navigate('/layout/form/piscina')}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors duration-200"
              title="Agregar nueva piscina"
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
              Agregar Piscina
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