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

export default function MonitoreoPiscinas() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania } = useAuth(); // Obtener ID de compañía del usuario autenticado
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

  // Descargar los datos filtrados como Excel
  const handleDownload = () => {
    const dataToExport = filteredTableData.map((piscina, index) => ({
      'No.': index + 1,
      'Código': piscina.codigo,
      'Hectáreas': piscina.hectareas,
      'Ubicación': piscina.ubicacion
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Piscinas');

    const fileName = `monitoreo_piscinas_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        <p className="text-gray-600">Panel de control para el seguimiento de piscinas de la compañía</p>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Piscinas</h2>
          
          {/* Filtros */}
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <input
              type="text"
              name="busqueda"
              value={filters.busqueda}
              onChange={handleFilterChange}
              placeholder="Buscar por código o ubicación..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hectáreas</th>
                <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">
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
                      {piscina.ubicacion}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
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