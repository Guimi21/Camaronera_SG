import React, { useState, useEffect } from "react";
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from "xlsx";
import config from "../../config";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

export default function Directivo() {
  const { API_BASE_URL } = config;
  const [data, setData] = useState([]);
  const [filteredGeneralData, setFilteredGeneralData] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [filters, setFilters] = useState({
    piscinaGeneral: "todas",
    filterType: "piscina",
    piscinaTable: "todas",
    startDate: "",
    endDate: "",
    tipoSiembra: "todos"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState(null);

  // Función para normalizar los datos del backend al formato esperado por el frontend
  const normalizeData = (backendData) => {
    return backendData.map(item => ({
      piscina: item.Piscina,
      fecha_siembra: item["Fecha de siembra"],
      biomasa_lbs: parseFloat(item.Biomasa) || 0,
      consumo_balanceado_kg: parseFloat(item["Balanc Acum"]) || 0,
      tca: parseFloat(item["Conv Alim"]) || 0,
      supervivencia: parseFloat(item["sobrev actual %"]) || 0,
      densidad_ha: parseFloat(item.Densidad) || 0,
      poblacion_actual: parseFloat(item["Población actual"]) || 0,
      observaciones: item.Observaciones,
      tipo_siembra: item["Tipo Siembra"],
      // Campos adicionales del backend por si son necesarios
      has: parseFloat(item.Has) || 0,
      dias_cultivo: parseInt(item["Dias cultivo"]) || 0,
      siembra_larvas: item["Siembra / Larvas"],
      peso: parseFloat(item.Peso) || 0,
      inc_p: parseFloat(item["Inc.P"]) || 0
    }));
  };

  // Función para obtener datos generales del backend
  const fetchGeneralData = async (piscinaValue = "todas") => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (piscinaValue !== "todas") {
        queryParams.append('piscina', piscinaValue);
      }
      
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
        const normalizedData = normalizeData(result.data);
        setData(normalizedData);
        setFilteredGeneralData(normalizedData);
        setError(null);
      } else {
        throw new Error(result.message || "Error al obtener datos generales");
      }
      
    } catch (err) {
      console.error("Error fetching general data:", err);
      setError(err.message || "No se pudieron cargar los datos generales.");
      
      // Datos de ejemplo como respaldo (ya normalizados)
      const exampleData = [
        {
          piscina: "01",
          fecha_siembra: "2025-09-01",
          biomasa_lbs: 1200,
          consumo_balanceado_kg: 500,
          tca: 1.5,
          supervivencia: 90,
          densidad_ha: 1000,
          poblacion_actual: 3000,
          observaciones: "Todo en orden",
          tipo_siembra: "directo"
        },
        {
          piscina: "02",
          fecha_siembra: "2025-09-02",
          biomasa_lbs: 1500,
          consumo_balanceado_kg: 600,
          tca: 1.8,
          supervivencia: 85,
          densidad_ha: 1050,
          poblacion_actual: 3200,
          observaciones: "Buena producción",
          tipo_siembra: "transferencia"
        }
      ];
      setData(exampleData);
      setFilteredGeneralData(exampleData);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener datos de tabla con filtros específicos
  const fetchTableData = async (filterParams = {}) => {
    try {
      setLoadingTable(true);
      
      const queryParams = new URLSearchParams();
      
      if (filterParams.piscina && filterParams.piscina !== "todas") {
        queryParams.append('piscina', filterParams.piscina);
      }
      
      if (filterParams.startDate && filterParams.endDate) {
        queryParams.append('startDate', filterParams.startDate);
        queryParams.append('endDate', filterParams.endDate);
      }
      
      if (filterParams.tipoSiembra && filterParams.tipoSiembra !== "todos") {
        queryParams.append('tipoSiembra', filterParams.tipoSiembra);
      }
      
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
        const normalizedData = normalizeData(result.data);
        setFilteredTableData(normalizedData);
        setError(null);
      } else {
        throw new Error(result.message || "Error al obtener datos de tabla");
      }
      
    } catch (err) {
      console.error("Error fetching table data:", err);
      setError(err.message || "No se pudieron cargar los datos de la tabla.");
      
      // Datos de ejemplo como respaldo (ya normalizados)
      const exampleData = [
        {
          piscina: "01",
          fecha_siembra: "2025-09-01",
          biomasa_lbs: 1200,
          consumo_balanceado_kg: 500,
          tca: 1.5,
          supervivencia: 90,
          densidad_ha: 1000,
          poblacion_actual: 3000,
          observaciones: "Todo en orden",
          tipo_siembra: "directo"
        },
        {
          piscina: "02",
          fecha_siembra: "2025-09-02",
          biomasa_lbs: 1500,
          consumo_balanceado_kg: 600,
          tca: 1.8,
          supervivencia: 85,
          densidad_ha: 1050,
          poblacion_actual: 3200,
          observaciones: "Buena producción",
          tipo_siembra: "transferencia"
        }
      ];
      setFilteredTableData(exampleData);
    } finally {
      setLoadingTable(false);
    }
  };

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    fetchGeneralData();
    fetchTableData({});
  }, []);

  // Cálculos de datos generales
  const totalPiscinas = filteredGeneralData.length;
  const consumoTotalBalanceado = filteredGeneralData.reduce((total, item) => total + (item.consumo_balanceado_kg || 0), 0);
  const tcaPromedio = totalPiscinas > 0 ? filteredGeneralData.reduce((total, item) => total + (item.tca || 0), 0) / totalPiscinas : 0;
  const porcentajeSupervivencia = totalPiscinas > 0 ? (filteredGeneralData.reduce((total, item) => total + (item.supervivencia || 0), 0) / totalPiscinas).toFixed(2) : 0;
  const biomasaTotal = filteredGeneralData.reduce((total, item) => total + (item.biomasa_lbs || 0), 0);
  const densidadPromedio = totalPiscinas > 0 ? (filteredGeneralData.reduce((total, item) => total + (item.densidad_ha || 0), 0) / totalPiscinas).toFixed(0) : 0;

  // Configuración de gráficos
  const supervivenciaData = {
    labels: ['Supervivencia (%)', 'Pérdidas (%)'],
    datasets: [
      {
        data: [parseFloat(porcentajeSupervivencia), 100 - parseFloat(porcentajeSupervivencia)],
        backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      }
    ]
  };

  const biomasaPorPiscinaData = {
    labels: filteredGeneralData.map(item => `Piscina ${item.piscina}`),
    datasets: [
      {
        label: 'Biomasa por Piscina (lbs)',
        data: filteredGeneralData.map(item => item.biomasa_lbs || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
    ]
  };

  const densidadData = {
    labels: filteredGeneralData.map(item => `Piscina ${item.piscina}`),
    datasets: [
      {
        label: 'Densidad por Hectárea',
        data: filteredGeneralData.map(item => item.densidad_ha || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ]
  };

  const tcaData = {
    labels: filteredGeneralData.map(item => `Piscina ${item.piscina}`),
    datasets: [
      {
        label: 'Tasa de Conversión Alimenticia (TCA)',
        data: filteredGeneralData.map(item => item.tca || 0),
        fill: false,
        borderColor: 'rgba(255, 159, 64, 1)',
        tension: 0.1,
      }
    ]
  };

  // Manejo de cambios en los filtros
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });

    // Aplicar filtro de datos generales automáticamente al cambiar
    if (name === "piscinaGeneral") {
      fetchGeneralData(value);
    }
  };

  // Aplicar filtros para la tabla
  const handleTableFilterSubmit = () => {
    const filterParams = {};
    
    if (filters.filterType === "piscina" && filters.piscinaTable !== "todas") {
      filterParams.piscina = filters.piscinaTable;
    }
    
    if (filters.filterType === "fecha" && filters.startDate && filters.endDate) {
      filterParams.startDate = filters.startDate;
      filterParams.endDate = filters.endDate;
    }
    
    if (filters.filterType === "tipo_siembra" && filters.tipoSiembra !== "todos") {
      filterParams.tipoSiembra = filters.tipoSiembra;
    }
    
    fetchTableData(filterParams);
    setCurrentPage(1);
  };

  // Descargar los datos filtrados como Excel
  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, "reporte_produccion.xlsx");
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredTableData.slice(indexOfFirstItem, indexOfLastItem);

  // Obtener lista única de piscinas para los filtros
  const uniquePiscinas = [...new Set(data.map(item => item.piscina))].sort();

  return (
    <div className="panel-directivo p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2 text-blue-800">Panel Directivo</h1>
        <p className="text-gray-600 mb-6">Aquí se muestran reportes y estadísticas para los directivos.</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3">Cargando datos generales...</span>
          </div>
        )}

        {/* Filtro para Datos Generales */}
        <div className="filters mb-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Filtro para Datos Generales</h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Piscina:</label>
            <select 
              name="piscinaGeneral" 
              value={filters.piscinaGeneral} 
              onChange={handleFilterChange}
              className="border rounded p-2 text-sm"
            >
              <option value="todas">Todas las Piscinas</option>
              {uniquePiscinas.map(piscina => (
                <option key={piscina} value={piscina}>Piscina {piscina}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mostrar contenido solo si no está cargando */}
        {!loading && (
          <>
            {/* Gráficos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">Porcentaje de Supervivencia</h3>
                <div className="h-64">
                  <Doughnut 
                    data={supervivenciaData} 
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">Biomasa por Piscina (lbs)</h3>
                <div className="h-64">
                  <Bar 
                    data={biomasaPorPiscinaData} 
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">Densidad por Piscina (/ha)</h3>
                <div className="h-64">
                  <Bar 
                    data={densidadData} 
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">TCA por Piscina</h3>
                <div className="h-64">
                  <Line 
                    data={tcaData} 
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            </div>

            
            {/* Resumen de datos generales - Estilo similar al ejemplo */}
            <div className="datos-generales mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 rounded-lg shadow text-white">
                <h4 className="font-medium text-sm opacity-80">SUPERVIVENCIA PROMEDIO</h4>
                <p className="text-3xl font-bold mt-2">{porcentajeSupervivencia}%</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-700 p-6 rounded-lg shadow text-white">
                <h4 className="font-medium text-sm opacity-80">BIOMASA TOTAL</h4>
                <p className="text-3xl font-bold mt-2">{biomasaTotal.toLocaleString()} lbs</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-6 rounded-lg shadow text-white">
                <h4 className="font-medium text-sm opacity-80">DENSIDAD PROMEDIO</h4>
                <p className="text-3xl font-bold mt-2">{densidadPromedio}/ha</p>
              </div>
            </div>

            {/* Información adicional de resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-500 text-sm">Total Piscinas</h4>
                <p className="text-xl font-bold text-blue-700">{totalPiscinas}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-500 text-sm">Consumo Balanceado</h4>
                <p className="text-xl font-bold text-blue-700">{consumoTotalBalanceado.toLocaleString()} kg</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-500 text-sm">TCA Promedio</h4>
                <p className="text-xl font-bold text-blue-700">{tcaPromedio.toFixed(2)}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-500 text-sm">Población Total</h4>
                <p className="text-xl font-bold text-blue-700">
                  {filteredGeneralData.reduce((total, item) => total + (item.poblacion_actual || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Filtros para la tabla */}
            <div className="filtros-tabla mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">Filtros para Tabla Detallada</h3>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium">Tipo de Búsqueda:</label>
                <select 
                  name="filterType" 
                  value={filters.filterType} 
                  onChange={handleFilterChange} 
                  className="border rounded p-2 text-sm"
                >
                  <option value="piscina">Por Piscina</option>
                  <option value="fecha">Por Fecha de Siembra</option>
                  <option value="tipo_siembra">Por Tipo de Siembra</option>
                </select>

                {/* Filtros específicos según el tipo seleccionado */}
                {filters.filterType === "piscina" && (
                  <>
                    <select 
                      name="piscinaTable" 
                      value={filters.piscinaTable} 
                      onChange={handleFilterChange} 
                      className="border rounded p-2 text-sm"
                    >
                      <option value="todas">Todas las Piscinas</option>
                      {uniquePiscinas.map(piscina => (
                        <option key={piscina} value={piscina}>Piscina {piscina}</option>
                      ))}
                    </select>
                  </>
                )}

                {filters.filterType === "fecha" && (
                  <>
                    <input 
                      type="date" 
                      name="startDate" 
                      value={filters.startDate} 
                      onChange={handleFilterChange} 
                      className="border rounded p-2 text-sm" 
                    />
                    <span className="text-sm">a</span>
                    <input 
                      type="date" 
                      name="endDate" 
                      value={filters.endDate} 
                      onChange={handleFilterChange} 
                      className="border rounded p-2 text-sm" 
                    />
                  </>
                )}

                {filters.filterType === "tipo_siembra" && (
                  <>
                    <select 
                      name="tipoSiembra" 
                      value={filters.tipoSiembra} 
                      onChange={handleFilterChange} 
                      className="border rounded p-2 text-sm"
                    >
                      <option value="todos">Todos los tipos</option>
                      <option value="Postlarva PL12">Postlarva PL12</option>
                      <option value="Postlarva PL15">Postlarva PL15</option>
                    </select>
                  </>
                )}
                
                <button 
                  onClick={handleTableFilterSubmit} 
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
                  disabled={loadingTable}
                >
                  {loadingTable ? 'Cargando...' : 'Aplicar Filtro'}
                </button>
              </div>
            </div>

            {/* Indicador de carga para la tabla */}
            {loadingTable && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3">Cargando datos de tabla...</span>
              </div>
            )}

            {/* Tabla de Datos Filtrados */}
            <div className="table-container overflow-x-auto bg-white rounded-lg shadow mb-4">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold">Piscina</th>
                    <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold">Fecha Siembra</th>
                    <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold">Biomasa (lbs)</th>
                    <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold">Población Actual</th>
                    <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold">Supervivencia (%)</th>
                    <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold">Densidad (/ha)</th>
                    <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {!loadingTable && currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-4 border-b">{item.piscina}</td>
                        <td className="py-3 px-4 border-b">{item.fecha_siembra}</td>
                        <td className="py-3 px-4 border-b">{item.biomasa_lbs.toLocaleString()}</td>
                        <td className="py-3 px-4 border-b">{item.poblacion_actual.toLocaleString()}</td>
                        <td className="py-3 px-4 border-b">{item.supervivencia.toFixed(2)}%</td>
                        <td className="py-3 px-4 border-b">{item.densidad_ha.toLocaleString()}</td>
                        <td className="py-3 px-4 border-b">{item.observaciones}</td>
                      </tr>
                    ))
                  ) : (
                    !loadingTable && (
                      <tr>
                        <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                          No hay datos disponibles con los filtros seleccionados
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación y botón de descarga */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="pagination flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={currentPage === 1 || loadingTable}
                  className="bg-blue-100 text-blue-800 px-3 py-2 rounded disabled:opacity-50 hover:bg-blue-200 transition"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">Página {currentPage}</span>
                <button 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage * itemsPerPage >= filteredTableData.length || loadingTable}
                  className="bg-blue-100 text-blue-800 px-3 py-2 rounded disabled:opacity-50 hover:bg-blue-200 transition"
                >
                  Siguiente
                </button>
              </div>

              <div className="download-button">
                <button 
                  onClick={handleDownload}
                  className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 transition"
                  disabled={loadingTable || filteredTableData.length === 0}
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