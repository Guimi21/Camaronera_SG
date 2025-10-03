import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from "xlsx";
import config from "../../config";
import { useAuth } from "../../context/AuthContext";
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
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania } = useAuth(); // Obtener ID de compañía del usuario autenticado
  const [data, setData] = useState([]);
  const [filteredGeneralData, setFilteredGeneralData] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [availablePiscinas, setAvailablePiscinas] = useState([]); // Piscinas disponibles para el usuario
  const [filters, setFilters] = useState({
    piscinaGeneral: "todas",
    filterType: "piscina",
    piscinaTable: "todas",
    startDate: "",
    endDate: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState(null);

  // Función para normalizar los datos del backend al formato esperado por el frontend
  const normalizeData = (backendData) => {
    return backendData.map(item => ({
      piscina: item.Piscina,
      has: item.Has,  
      fecha_siembra: item["Fecha de siembra"],
      dias_cultivo: item["Dias cultivo"],
      siembra_larvas: item["Siembra / Larvas"],
      densidad_ha: item.Densidad,
      tipo_siembra: item["Tipo Siembra"],
      peso: item.Peso,
      inc: item["Inc.P"],
      biomasa_lbs: item["Biomasa Lbs"],
      balnova22: item.Balnova22,
      balnova12: item.Balnova12,
      balnova08: item.Balnova08,
      balanceado_acu: item["Balanceado Acumulado"],
      conversion_alimenticia: item["Conversión Alimenticia"],
      poblacion_actual: item["Población actual"],
      supervivencia: item["Sobrev. Actual %"],
      observaciones: item.Observaciones,
      fecha_seguimiento: item["Fecha Seguimiento"]
    }));
  };

  // Función para obtener datos generales del backend
  const fetchGeneralData = async (piscinaValue = "todas") => {
    // Verificar que el usuario tenga idCompania antes de hacer la petición
    if (!idCompania) {
      setError("No se pudo obtener la información de la compañía del usuario.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (piscinaValue !== "todas") {
        queryParams.append('piscina', piscinaValue);
      }
      
      // Agregar el id_compania del usuario autenticado
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
        const normalizedData = normalizeData(result.data);
        setData(normalizedData);
        setFilteredGeneralData(normalizedData);
        
        // Actualizar piscinas disponibles (únicas) para el usuario de esta compañía
        // Preservar el orden que viene del backend (ordenado por id_piscina)
        const uniquePiscinas = [];
        const seenPiscinas = new Set();
        
        normalizedData.forEach(item => {
          if (!seenPiscinas.has(item.piscina)) {
            uniquePiscinas.push(item.piscina);
            seenPiscinas.add(item.piscina);
          }
        });
        
        setAvailablePiscinas(uniquePiscinas);
        
        // Log para verificar el orden de las piscinas
        console.log('Piscinas ordenadas por id_piscina:', uniquePiscinas);
        
        // Resetear filtros de piscina si la piscina seleccionada ya no está disponible
        if (filters.piscinaTable !== "todas" && !uniquePiscinas.includes(filters.piscinaTable)) {
          setFilters(prev => ({ ...prev, piscinaTable: "todas" }));
        }
        if (filters.piscinaGeneral !== "todas" && !uniquePiscinas.includes(filters.piscinaGeneral)) {
          setFilters(prev => ({ ...prev, piscinaGeneral: "todas" }));
        }
        
        setError(null);
      } else {
        throw new Error(result.message || "Error al obtener datos generales");
      }
      
    } catch (err) {
      console.error("Error fetching general data:", err);
      setError(err.message || "No se pudieron cargar los datos generales.");
      
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (filterParams = {}) => {
    // Verificar que el usuario tenga idCompania antes de hacer la petición
    if (!idCompania) {
      setError("No se pudo obtener la información de la compañía del usuario.");
      setLoadingTable(false);
      return;
    }

    try {
      setLoadingTable(true);
      
      const queryParams = new URLSearchParams();

      // Filtro de piscina (si no es "todas")
      if (filterParams.piscina && filterParams.piscina !== "todas") {
        queryParams.append('piscina', filterParams.piscina);
      }

      // Filtro de fecha (si se han establecido las fechas)
      if (filterParams.startDate && filterParams.endDate) {
        queryParams.append('startDate', filterParams.startDate);
        queryParams.append('endDate', filterParams.endDate);
      }
      
      // Agregar el id_compania del usuario autenticado
      queryParams.append('id_compania', idCompania);
      
      // Hacer la llamada GET con los parámetros de la URL
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
      
    } finally {
      setLoadingTable(false);
    }
  };

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    // Solo cargar datos si el usuario tiene idCompania
    if (idCompania) {
      fetchGeneralData();
      fetchTableData();
    } else {
      // Si no hay idCompania, limpiar las piscinas disponibles
      setAvailablePiscinas([]);
    }
  }, [idCompania]); // Agregar idCompania como dependencia

  // Cálculos de datos generales
  const totalPiscinas = filteredGeneralData.length;
  const consumoTotalBalanceado = filteredGeneralData.reduce((total, item) => total + (item.cantidad_balanceado_kg || 0), 0);
  const tcaPromedio = totalPiscinas > 0 ? filteredGeneralData.reduce((total, item) => total + (item.conversion_alimenticia || 0), 0) / totalPiscinas : 0;
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
        data: filteredGeneralData.map(item => item.conversion_alimenticia || 0),
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

    // Siempre aplicar filtro de piscina (si no es "todas")
    if (filters.piscinaTable !== "todas") {
      filterParams.piscina = filters.piscinaTable;
    }

    // Si se han establecido fechas, agregar filtro de fecha
    if (filters.startDate && filters.endDate) {
      filterParams.startDate = filters.startDate;
      filterParams.endDate = filters.endDate;
    }

    // Llamada a la función para obtener los datos con los filtros aplicados
    fetchTableData(filterParams);
  };

  // Descargar los datos filtrados como Excel
  const handleDownload = () => {
    // Preparar datos para Excel
    const excelData = filteredTableData.map(item => ({
      "Piscina": item.piscina,
      "Has": item.has,
      "Fecha Siembra": item.fecha_siembra,
      "Días de Cultivo": item.dias_cultivo,
      "Siembra/Larvas": item.siembra_larvas,
      "Densidad (/ha)": item.densidad_ha,
      "Tipo Siembra": item.tipo_siembra,
      "Peso (g)": item.peso,
      "Inc.P (%)": item.inc,
      "Biomasa (lbs)": item.biomasa_lbs,
      "35% Balnova 0,8 mm": item.balnova08,
      "35% Balnova 1,2 mm": item.balnova12,
      "35% Balnova 2,2": item.balnova22,
      "Balanceado Acumulado": item.balanceado_acu,
      "Conversión Alimenticia": item.conversion_alimenticia,
      "Población Actual": item.poblacion_actual,
      "Supervivencia (%)": item.supervivencia,
      "Observaciones": item.observaciones,
      "Fecha Seguimiento": item.fecha_seguimiento
    }));
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Producción");
    XLSX.writeFile(wb, "reporte_produccion.xlsx");
  };

  // Paginación
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredTableData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="panel-directivo bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 max-w-full">
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

        {/* Mostrar contenido solo si no está cargando */}
        {!loading && (
          <>
            {/* Filtros para la tabla */}
            <div className="filtros-tabla mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">Filtros para Tabla Detallada</h3>
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro de Piscina */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Muestras:</label>
                  <select 
                    name="piscinaTable" 
                    value={filters.piscinaTable} 
                    onChange={handleFilterChange} 
                    className="border rounded p-2 text-sm"
                    disabled={loading || availablePiscinas.length === 0}
                  >
                    <option value="todas">
                      {loading ? "Cargando piscinas..." : "Todas las Piscinas"}
                    </option>
                    {availablePiscinas.map(piscina => (
                      <option key={piscina} value={piscina}>Piscina {piscina}</option>
                    ))}
                  </select>
                </div>
                <label className="text-sm font-medium mb-1">Fecha de Muestra:</label>
                {/* Filtro de Fecha */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Muestra Desde:</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={filters.startDate} 
                    onChange={handleFilterChange} 
                    className="border rounded p-2 text-sm dateInput" 
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Muestra Hasta:</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    value={filters.endDate} 
                    onChange={handleFilterChange} 
                    className="border rounded p-2 text-sm dateInput" 
                  />
                </div>

                <div className="flex items-end">
                  <button 
                    onClick={() => {
                      setCurrentPage(1);
                      handleTableFilterSubmit();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
                    disabled={loadingTable}
                  >
                    {loadingTable ? 'Cargando...' : 'Aplicar Filtro'}
                  </button>
                </div>
              </div>
            </div>

            {/* Indicador de carga para la tabla */}
            {loadingTable && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3">Cargando datos de tabla...</span>
              </div>
            )}

            {/* Tabla de Datos Filtrados con scroll horizontal y vertical */}
            <div className="table-container mb-4 bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto max-w-full">
                <table className="min-w-full">
                  <thead className="sticky top-0 bg-blue-100 z-10">
                    <tr>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Piscina</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Has</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Fecha Siembra</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Dias Cultivo</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Siembra Larvas</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Densidad (/ha)</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Tipo Siembra</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Peso (g)</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Inc.P (%)</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Biomasa (lbs)</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Balnova 0,8 mm</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Balnova 1,2 mm</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Balnova 2,2</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Balanceado Acum.</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Conv. Alimenticia</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Población Actual</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Supervivencia (%)</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Observaciones</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Fecha Seguimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loadingTable && currentData.length > 0 ? (
                      currentData.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.piscina}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.has}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.fecha_siembra}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.dias_cultivo}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.siembra_larvas?.toLocaleString() || '0'}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.densidad_ha}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.tipo_siembra}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.peso}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.inc}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.biomasa_lbs?.toLocaleString() || '0'}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.balnova08?.toLocaleString() || '0'}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.balnova12?.toLocaleString() || '0'}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.balnova22?.toLocaleString() || '0'}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.balanceado_acu?.toLocaleString() || '0'}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.conversion_alimenticia}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.poblacion_actual?.toLocaleString() || '0'}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.supervivencia}%</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.observaciones}</td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">{item.fecha_seguimiento}</td>
                        </tr>
                      ))
                    ) : (
                      !loadingTable && (
                        <tr>
                          <td colSpan="10" className="py-4 px-4 text-center text-gray-500">
                            No hay datos disponibles con los filtros seleccionados
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>            
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
                <span className="text-sm text-gray-600">Página {currentPage} de {Math.ceil(filteredTableData.length / itemsPerPage)}</span>
                <button 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage * itemsPerPage >= filteredTableData.length || loadingTable}
                  className="bg-blue-100 text-blue-800 px-3 py-2 rounded disabled:opacity-50 hover:bg-blue-200 transition"
                >
                  Siguiente
                </button>
                
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border rounded p-2 text-sm"
                >
                  <option value="5">5 por página</option>
                  <option value="10">10 por página</option>
                  <option value="15">15 por página</option>
                  <option value="20">25 por página</option>
                  <option value="50">50 por página</option>
                </select>
              </div>

              {/* Botón para agregar nuevo registro */}
              <button
                onClick={() => navigate('/layout/form/ciclo')}
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors duration-200"
                title="Agregar nuevo registro"
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
                Agregar Seguimiento
              </button>

              {/* Botón de descarga */}
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
          </>
        )}
      </div>
    </div>
  );
}