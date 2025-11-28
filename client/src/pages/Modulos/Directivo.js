import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from "xlsx";
import config from "../../config";
import { useAuth } from "../../context/AuthContext";
import { fetchApi } from "../../services/api";
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

export default function Directivo() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania, compania } = useAuth(); // Obtener ID de compañía y nombre del usuario autenticado
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [availablePiscinas, setAvailablePiscinas] = useState([]); // Piscinas disponibles para el usuario
  const [tiposBalanceado, setTiposBalanceado] = useState([]); // Tipos de balanceado de la compañía
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
  const normalizeData = (backendData, tipos) => {
    // Usar los tipos pasados como parámetro, o los del estado si no se pasan
    const tiposToUse = tipos || tiposBalanceado;
    
    return backendData.map((item, index) => {
      const normalized = {
        id_muestra: item.id_muestra,
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
        balanceado_acu: item["Balanceado Acumulado"],
        conversion_alimenticia: item["Conversión Alimenticia"],
        poblacion_actual: item["Población actual"],
        supervivencia: item["Sobrev. Actual %"],
        observaciones: item.Observaciones,
        estado: item.Estado,
        fecha_muestra: item["Fecha Muestra"],
        fecha_creacion: item["Fecha Creación"] || null,
        fecha_actualizacion: item["Última Actualización"] || null,
        balanceados: {} // Objeto para almacenar dinámicamente los tipos de balanceado
      };
      
      // Agregar dinámicamente los tipos de balanceado
      tiposToUse.forEach(tipo => {
        normalized.balanceados[tipo.nombre] = item[tipo.nombre] || 0;
      });
      
      return normalized;
    });
  };

  // Función para obtener datos generales del backend
  const fetchGeneralData = async (piscinaValue = "todas", tipos = null) => {
    // Verificar que el usuario tenga idCompania antes de hacer la petición
    if (!idCompania) {
      setError("No se pudo obtener la información de la compañía del usuario.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let url = `${API_BASE_URL}/module/muestras.php?id_compania=${idCompania}`;
      if (piscinaValue !== "todas") {
        url += `&piscina=${piscinaValue}`;
      }
      
      const data = await fetchApi(url, "Error al obtener datos generales");
      
      const normalizedData = normalizeData(data, tipos);
      
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
      
      // Resetear filtros de piscina si la piscina seleccionada ya no está disponible
      if (filters.piscinaTable !== "todas" && !uniquePiscinas.includes(filters.piscinaTable)) {
        setFilters(prev => ({ ...prev, piscinaTable: "todas" }));
      }
      if (filters.piscinaGeneral !== "todas" && !uniquePiscinas.includes(filters.piscinaGeneral)) {
        setFilters(prev => ({ ...prev, piscinaGeneral: "todas" }));
      }
      
      setError(null);
      
    } catch (err) {
      console.error("Error fetching general data:", err);
      setError(err.message || "No se pudieron cargar los datos generales.");
      
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (filterParams = {}, tipos = null) => {
    // Verificar que el usuario tenga idCompania antes de hacer la petición
    if (!idCompania) {
      setError("No se pudo obtener la información de la compañía del usuario.");
      setLoadingTable(false);
      return;
    }

    try {
      setLoadingTable(true);
      
      let url = `${API_BASE_URL}/module/muestras.php?id_compania=${idCompania}`;

      // Filtro de piscina (si no es "todas")
      if (filterParams.piscina && filterParams.piscina !== "todas") {
        url += `&piscina=${filterParams.piscina}`;
      }

      // Filtro de fecha (si se han establecido las fechas)
      if (filterParams.startDate && filterParams.endDate) {
        url += `&startDate=${filterParams.startDate}&endDate=${filterParams.endDate}`;
      }
      
      const data = await fetchApi(url, "Error al obtener datos de tabla");
      
      const normalizedData = normalizeData(data, tipos);
      setFilteredTableData(normalizedData);
      setError(null);
      
    } catch (err) {
      console.error("Error fetching table data:", err);
      setError(err.message || "No se pudieron cargar los datos de la tabla.");
      
    } finally {
      setLoadingTable(false);
    }
  };

  // Función para obtener los tipos de balanceado de la compañía
  const fetchTiposBalanceado = async () => {
    if (!idCompania) {
      console.error("No hay ID de compañía disponible");
      return [];
    }

    try {
      const data = await fetchApi(
        `${API_BASE_URL}/module/tipos_balanceado.php?id_compania=${idCompania}`,
        "Error al obtener tipos de balanceado"
      );
      setTiposBalanceado(data);
      return data;
    } catch (err) {
      console.error("Error fetching tipos balanceado:", err);
      setTiposBalanceado([]);
      return [];
    }
  };

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    // Solo cargar datos si el usuario tiene idCompania
    if (idCompania) {
      const loadData = async () => {
        // Primero cargar tipos de balanceado y obtener el resultado
        const tipos = await fetchTiposBalanceado();
        // Luego cargar los datos pasando los tipos
        await fetchGeneralData("todas", tipos);
        await fetchTableData({}, tipos);
      };
      
      loadData();
    } else {
      // Si no hay idCompania, limpiar las piscinas disponibles
      setAvailablePiscinas([]);
    }
  }, [idCompania]); // Agregar idCompania como dependencia

  // Función para determinar si una muestra es la más reciente de su piscina
  const isLatestMuestraForPiscina = (item) => {
    // Agrupar items por piscina y comparar fechas
    const itemsForPiscina = filteredTableData.filter(i => i.piscina === item.piscina);
    if (itemsForPiscina.length === 0) return false;
    
    // Encontrar la fecha más reciente para esta piscina
    let latestItem = itemsForPiscina[0];
    
    for (let i = 1; i < itemsForPiscina.length; i++) {
      const currentItem = itemsForPiscina[i];
      
      // Comparar primero por fecha de muestra
      const currentDate = new Date(currentItem.fecha_muestra);
      const latestDate = new Date(latestItem.fecha_muestra);
      
      if (currentDate > latestDate) {
        latestItem = currentItem;
      } else if (currentDate.getTime() === latestDate.getTime()) {
        // Si las fechas de muestra son iguales, comparar por fecha de creación
        const currentCreationDate = new Date(currentItem.fecha_creacion);
        const latestCreationDate = new Date(latestItem.fecha_creacion);
        
        if (currentCreationDate > latestCreationDate) {
          latestItem = currentItem;
        }
      }
    }
    
    // Comparar el item actual con el más reciente encontrado
    const itemDate = new Date(item.fecha_muestra);
    const latestDate = new Date(latestItem.fecha_muestra);
    
    if (itemDate.getTime() === latestDate.getTime()) {
      // Si las fechas de muestra son iguales, comparar por fecha de creación
      const itemCreationDate = new Date(item.fecha_creacion);
      const latestCreationDate = new Date(latestItem.fecha_creacion);
      
      return itemCreationDate.getTime() === latestCreationDate.getTime();
    }
    
    return false;
  };

  // Función para manejar el click en botón Editar/Consultar
  const handleOpenMuestraView = (muestraId, isLatest) => {
    const mode = isLatest ? 'edit' : 'view';
    navigate(`/layout/dashboard/muestra-edit?id=${muestraId}&mode=${mode}`);
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
      fetchGeneralData(value, tiposBalanceado);
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
    fetchTableData(filterParams, tiposBalanceado);
  };

  // Formatear fecha para mostrar (evita problemas de zona horaria)
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
    // Preparar datos para Excel
    const excelData = filteredTableData.map(item => {
      const baseData = {
        "Piscina": item.piscina,
        "Has": item.has,
        "Fecha Siembra": formatDate(item.fecha_siembra, false),
        "Días de Cultivo": item.dias_cultivo,
        "Siembra/Larvas": item.siembra_larvas,
        "Densidad (/ha)": item.densidad_ha,
        "Tipo Siembra": item.tipo_siembra,
        "Peso (g)": item.peso,
        "Inc.P (%)": item.inc,
        "Biomasa (lbs)": item.biomasa_lbs
      };
      
      // Agregar dinámicamente las columnas de balanceado
      tiposBalanceado.forEach(tipo => {
        baseData[tipo.nombre] = item.balanceados[tipo.nombre] || 0;
      });
      
      // Agregar las columnas finales
      baseData["Balanceado Acumulado"] = item.balanceado_acu;
      baseData["Conversión Alimenticia"] = item.conversion_alimenticia;
      baseData["Población Actual"] = item.poblacion_actual;
      baseData["Supervivencia (%)"] = item.supervivencia;
      baseData["Observaciones"] = item.observaciones;
      baseData["Estado"] = item.estado;
      baseData["Fecha Muestra"] = formatDate(item.fecha_muestra, false);
      baseData["Fecha Creación"] = formatDate(item.fecha_creacion, true);
      baseData["Última Actualización"] = formatDate(item.fecha_actualizacion, true);
      
      return baseData;
    });
    
    // Si no hay datos, crear un array con un objeto vacío para mostrar los encabezados
    let finalData = excelData;
    if (excelData.length === 0) {
      const emptyRow = {
        "Piscina": "",
        "Has": "",
        "Fecha Siembra": "",
        "Días de Cultivo": "",
        "Siembra/Larvas": "",
        "Densidad (/ha)": "",
        "Tipo Siembra": "",
        "Peso (g)": "",
        "Inc.P (%)": "",
        "Biomasa (lbs)": ""
      };
      
      // Agregar columnas dinámicas de balanceado vacías
      tiposBalanceado.forEach(tipo => {
        emptyRow[tipo.nombre] = "";
      });
      
      // Agregar columnas finales vacías
      emptyRow["Balanceado Acumulado"] = "";
      emptyRow["Conversión Alimenticia"] = "";
      emptyRow["Población Actual"] = "";
      emptyRow["Supervivencia (%)"] = "";
      emptyRow["Observaciones"] = "";
      emptyRow["Estado"] = "";
      emptyRow["Fecha Muestra"] = "";
      emptyRow["Fecha Creación"] = "";
      emptyRow["Última Actualización"] = "";
      
      finalData = [emptyRow];
    }
    
    const ws = XLSX.utils.json_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Producción");
    const companiaSlug = compania ? compania.replaceAll(' ', '_').toLowerCase() : 'compania';
    const fileName = `reporte_produccion_${companiaSlug}_${getLocalDateString()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Paginación
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredTableData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="panel-directivo bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 max-w-full">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2 text-blue-800">Monitoreo de Muestras</h1>
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
                  <label htmlFor="piscinaTable" className="text-sm font-medium mb-1">Muestras:</label>
                  <select 
                    id="piscinaTable"
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
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium">Fecha de Muestra:</legend>
                  {/* Filtro de Fecha */}
                  <div className="flex flex-col">
                    <label htmlFor="startDate" className="text-sm font-medium mb-1">Muestra Desde:</label>
                    <input 
                      id="startDate"
                      type="date" 
                      name="startDate" 
                      value={filters.startDate} 
                      onChange={handleFilterChange} 
                      className="border rounded p-2 text-sm dateInput" 
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label htmlFor="endDate" className="text-sm font-medium mb-1">Muestra Hasta:</label>
                    <input 
                      id="endDate"
                      type="date" 
                      name="endDate" 
                      value={filters.endDate} 
                      onChange={handleFilterChange} 
                      className="border rounded p-2 text-sm dateInput" 
                    />
                  </div>
                </fieldset>

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

            {/* Tabla de Datos Filtrados con scroll horizontal solo en la tabla */}
            <div className="table-container mb-4 bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
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
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Peso Promedio (g)</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Inc.P (%)</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Biomasa (lbs)</th>
                      {tiposBalanceado.map((tipo) => (
                        <th key={tipo.id_tipo_balanceado} className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">
                          {tipo.nombre}
                        </th>
                      ))}
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Balanceado Acum.</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Conv. Alimenticia</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Población Actual</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Supervivencia (%)</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Observaciones</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Estado</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Fecha Muestra</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Fecha Creación</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Última Actualización</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loadingTable && currentData.length > 0 ? (
                      currentData.map((item) => {
                        const isLatest = isLatestMuestraForPiscina(item);
                        return (
                          <tr key={item.id_muestra} className={item.id_muestra % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.piscina}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.has}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{formatDate(item.fecha_siembra, false)}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.dias_cultivo}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.siembra_larvas ? Number.parseInt(item.siembra_larvas) : 0}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.densidad_ha}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.tipo_siembra}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.peso}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.inc}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.biomasa_lbs?.toLocaleString() || '0'}</td>
                            {tiposBalanceado.map((tipo) => (
                              <td key={tipo.id_tipo_balanceado} className="py-3 px-4 border-b whitespace-nowrap">
                                {item.balanceados[tipo.nombre]?.toLocaleString() || '0'}
                              </td>
                            ))}
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.balanceado_acu?.toLocaleString() || '0'}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.conversion_alimenticia}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.poblacion_actual ? Number.parseInt(item.poblacion_actual) : 0}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.supervivencia}%</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{item.observaciones}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{getEstadoBadge(item.estado)}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{formatDate(item.fecha_muestra, false)}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{formatDate(item.fecha_creacion, true)}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">{formatDate(item.fecha_actualizacion, true)}</td>
                            <td className="py-3 px-4 border-b whitespace-nowrap">
                              <button
                                onClick={() => handleOpenMuestraView(item.id_muestra, isLatest)}
                                className={`text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1 ${
                                  isLatest 
                                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                                    : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                                title={isLatest ? "Editar muestra" : "Consultar muestra"}
                              >
                                {isLatest ? (
                                  <>
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
                                  </>
                                ) : (
                                  <>
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
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      !loadingTable && (
                        <tr>
                          <td colSpan={13 + tiposBalanceado.length} className="py-4 px-4 text-center text-gray-500">
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
            <div className="table-controls-wrapper">
              <div className="pagination-wrapper">
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
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded p-2 text-sm"
                  >
                    <option value="5">5 por página</option>
                    <option value="10">10 por página</option>
                    <option value="15">15 por página</option>
                    <option value="20">25 por página</option>
                    <option value="50">50 por página</option>
                  </select>
                </div>
              </div>

              {/* Botón de descarga */}
              <div className="action-buttons-wrapper">
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