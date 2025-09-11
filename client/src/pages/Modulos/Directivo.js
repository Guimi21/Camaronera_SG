import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

export default function Directivo() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    piscina: ""
  });

  // Cargar los datos generales al cargar la página
  useEffect(() => {
    axios.get("/api/dashboard/data")
      .then(response => setData(response.data))
      .catch(error => console.error("Error al cargar los datos generales", error));
  }, []);

  // Filtrar los datos según los filtros seleccionados
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleSubmit = () => {
    const { startDate, endDate, piscina } = filters;
    axios.get(`/api/dashboard/filter`, { params: { startDate, endDate, piscina } })
      .then(response => setData(response.data))
      .catch(error => console.error("Error al filtrar los datos", error));
  };

  // Función para exportar a Excel
  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(data);  // Convertir los datos a formato de hoja de Excel
    const wb = XLSX.utils.book_new();  // Crear un nuevo libro de trabajo
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");  // Añadir la hoja al libro
    XLSX.writeFile(wb, "reporte_produccion.xlsx");  // Descargar el archivo Excel
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Panel Directivo</h1>
      <p>Aquí se muestran reportes y estadísticas para los directivos.</p>
      
      {/* Filtros */}
      <div className="filters mb-4 mt-6">
        <label className="mr-2">Fecha de inicio:</label>
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          className="mb-2 p-2 border rounded"
        />
        <label className="mr-2">Fecha de fin:</label>
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          className="mb-2 p-2 border rounded"
        />
        <label className="mr-2">Piscina:</label>
        <select
          name="piscina"
          value={filters.piscina}
          onChange={handleFilterChange}
          className="mb-2 p-2 border rounded"
        >
          <option value="">Seleccionar Piscina</option>
          <option value="01">Piscina 01</option>
          <option value="02">Piscina 02</option>
        </select>
        <button
          onClick={handleSubmit}
          className="ml-4 p-2 bg-blue-500 text-white rounded"
        >
          Aplicar Filtro
        </button>
      </div>
      
      {/* Datos Generales */}
      <div className="data-summary mb-4">
        <h2 className="text-xl font-semibold">Datos Generales</h2>
        <div className="summary-item mt-2">
          <p>Total de Piscinas: {data.length}</p>
          <p>Biomasa Total: {data.reduce((total, item) => total + item.biomasa_lbs, 0)}</p>
        </div>
      </div>

      {/* Tabla de Datos Filtrados */}
      <div className="filtered-data mb-6">
        <h2 className="text-xl font-semibold">Consulta de Datos Filtrados</h2>
        <table className="min-w-full mt-2 border-collapse border border-gray-200">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Piscina</th>
              <th className="border border-gray-300 px-4 py-2">Fecha Siembra</th>
              <th className="border border-gray-300 px-4 py-2">Biomasa Lbs</th>
              <th className="border border-gray-300 px-4 py-2">Población Actual</th>
              <th className="border border-gray-300 px-4 py-2">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id_seguimiento}>
                <td className="border border-gray-300 px-4 py-2">{item.piscina}</td>
                <td className="border border-gray-300 px-4 py-2">{item.fecha_siembra}</td>
                <td className="border border-gray-300 px-4 py-2">{item.biomasa_lbs}</td>
                <td className="border border-gray-300 px-4 py-2">{item.poblacion_actual}</td>
                <td className="border border-gray-300 px-4 py-2">{item.observaciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botón para Descargar a Excel */}
      <div className="download-button mt-4">
        <button
          onClick={handleDownload}
          className="p-2 bg-green-500 text-white rounded"
        >
          Descargar Reporte en Excel
        </button>
      </div>
    </div>
  );
}
