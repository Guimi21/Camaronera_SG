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

export default function UsuariosAdmin() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idUsuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [filters, setFilters] = useState({
    busqueda: "",
    estado: "todos",
    grupoEmpresarial: "todos"
  });

  // Obtener usuarios administradores al montar el componente
  useEffect(() => {
    if (idUsuario) {
      fetchUsuariosAdmin();
    }
  }, [idUsuario]);

  const fetchUsuariosAdmin = async () => {
    try {
      setLoading(true);

      if (!idUsuario) {
        setError("No se pudo obtener la información del usuario.");
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('id_usuario', idUsuario);

      const response = await fetch(`${API_BASE_URL}/module/usuarios_admin.php?${queryParams.toString()}`, {
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
        setUsuarios(result.data);
        setFilteredUsuarios(result.data);
        setError(null);
      } else {
        throw new Error(result.message || "Error al obtener usuarios administradores");
      }

    } catch (err) {
      console.error("Error fetching usuarios admin:", err);
      setError(err.message || "No se pudieron cargar los usuarios administradores.");
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros cuando cambien los filtros o los datos
  useEffect(() => {
    let filtered = [...usuarios];

    // Filtrar por búsqueda (nombre, username)
    if (filters.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      filtered = filtered.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm) ||
        u.username.toLowerCase().includes(searchTerm) ||
        u.grupo_empresarial?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrar por estado
    if (filters.estado !== "todos") {
      filtered = filtered.filter(u => u.estado === filters.estado);
    }

    // Filtrar por grupo empresarial
    if (filters.grupoEmpresarial !== "todos") {
      filtered = filtered.filter(u => u.grupo_empresarial?.includes(filters.grupoEmpresarial));
    }

    setFilteredUsuarios(filtered);
    setCurrentPage(1); // Resetear página al filtrar
  }, [filters, usuarios]);

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

  // Formatear estado con badge de color
  const getEstadoBadge = (estado) => {
    const isActivo = estado === 'ACTIVO';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        isActivo
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {isActivo ? 'ACTIVO' : 'INACTIVO'}
      </span>
    );
  };

  // Descargar los datos filtrados como Excel
  const handleDownload = () => {
    // Preparar datos para Excel
    const excelData = filteredUsuarios.map((usuario, index) => ({
      'No.': index + 1,
      'Nombre': usuario.nombre,
      'Usuario': usuario.username,
      'Grupo Empresarial': usuario.grupo_empresarial || 'N/A',
      'Estado': usuario.estado,
      'Fecha Creación': formatDate(usuario.fecha_creacion),
      'Última Actualización': formatDate(usuario.fecha_actualizacion)
    }));

    // Si no hay datos, crear un array con un objeto vacío para mostrar los encabezados
    const finalData = excelData.length > 0 ? excelData : [
      { 'No.': '', 'Nombre': '', 'Usuario': '', 'Grupo Empresarial': '', 'Estado': '', 'Fecha Creación': '', 'Última Actualización': '' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios Administradores');

    const fileName = `reporte_usuarios_administradores_${getLocalDateString()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Obtener grupos empresariales únicos para el filtro
  const gruposEmpresarialesUnicos = [...new Set(
    usuarios.flatMap(u => u.grupo_empresarial ? [u.grupo_empresarial] : [])
  )].sort((a, b) => a.localeCompare(b, 'es'));

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);

  return (
    <div className="panel-administrador bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 max-w-full">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2 text-blue-800">Gestión de Usuarios Administradores</h1>
        <p className="text-gray-600 mb-6">Monitoreo y administración de usuarios con perfil de Administrador.</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3">Cargando usuarios administradores...</span>
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
                  <label htmlFor="busqueda_admin" className="text-sm font-medium mb-1">Buscar:</label>
                  <input
                    id="busqueda_admin"
                    type="text"
                    name="busqueda"
                    value={filters.busqueda}
                    onChange={handleFilterChange}
                    placeholder="Nombre, usuario, grupo empresarial..."
                    className="border rounded p-2 text-sm w-64"
                  />
                </div>

                {/* Filtro de estado */}
                <div className="flex flex-col">
                  <label htmlFor="estado_admin" className="text-sm font-medium mb-1">Estado:</label>
                  <select
                    id="estado_admin"
                    name="estado"
                    value={filters.estado}
                    onChange={handleFilterChange}
                    className="border rounded p-2 text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="ACTIVO">Activos</option>
                    <option value="INACTIVO">Inactivos</option>
                  </select>
                </div>

                {/* Filtro de grupo empresarial */}
                <div className="flex flex-col">
                  <label htmlFor="grupo_admin" className="text-sm font-medium mb-1">Grupo Empresarial:</label>
                  <select
                    id="grupo_admin"
                    name="grupoEmpresarial"
                    value={filters.grupoEmpresarial}
                    onChange={handleFilterChange}
                    className="border rounded p-2 text-sm"
                  >
                    <option value="todos">Todos</option>
                    {gruposEmpresarialesUnicos.map(grupo => (
                      <option key={grupo} value={grupo}>{grupo}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de usuarios */}
            <div className="table-container mb-4 bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">#</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Nombre</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Usuario</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Grupo Empresarial</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Estado</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Fecha Creación</th>
                      <th className="py-3 px-4 border-b text-left text-blue-800 font-semibold whitespace-nowrap">Última Actualización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsuarios.length > 0 ? (
                      currentUsuarios.map((usuario, index) => (
                        <tr key={usuario.id_usuario} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-3 px-4 border-b whitespace-nowrap font-semibold text-blue-600">
                            {indexOfFirstItem + index + 1}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap font-medium">
                            {usuario.nombre}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {usuario.username}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {usuario.grupo_empresarial || 'N/A'}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {getEstadoBadge(usuario.estado)}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {formatDate(usuario.fecha_creacion)}
                          </td>
                          <td className="py-3 px-4 border-b whitespace-nowrap">
                            {formatDate(usuario.fecha_actualizacion)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                          No hay usuarios administradores disponibles
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
                {/* Botón para crear nuevo usuario */}
                <button
                  onClick={() => navigate('/layout/form/usuario')}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Usuario
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
