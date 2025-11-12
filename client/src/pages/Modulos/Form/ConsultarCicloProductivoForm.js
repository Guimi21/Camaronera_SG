import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';

export default function ConsultarCicloProductivoForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Obtener el ID del ciclo desde la URL
  const { API_BASE_URL } = config;
  const { idCompania } = useAuth();
  
  const [formData, setFormData] = useState({
    id_piscina: '',
    fecha_siembra: '',
    fecha_cosecha: '',
    cantidad_siembra: '',
    densidad: '',
    biomasa_cosecha: '',
    tipo_siembra: '',
    id_tipo_alimentacion: '',
    nombre_tipo_alimentacion: '',
    promedio_incremento_peso: '',
    libras_por_hectarea: '',
    ruta_pdf: '',
    estado: 'EN_CURSO'
  });
  
  const [piscinas, setPiscinas] = useState([]);
  const [loadingPiscinas, setLoadingPiscinas] = useState(true);
  const [loadingCiclo, setLoadingCiclo] = useState(true);
  const [error, setError] = useState('');

  // Hacer scroll al inicio cuando hay un error
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Cargar datos del ciclo productivo a consultar
  useEffect(() => {
    const fetchCicloData = async () => {
      if (!idCompania || !id) {
        setError("No se pudo obtener la información necesaria.");
        setLoadingCiclo(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/module/ciclosproductivos.php?id_compania=${idCompania}&id_ciclo=${id}`, 
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          const ciclo = result.data;
          
          // Formatear las fechas para el input type="date"
          const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            return dateString.split('T')[0];
          };

          setFormData({
            id_piscina: ciclo.id_piscina || '',
            fecha_siembra: formatDateForInput(ciclo.fecha_siembra),
            fecha_cosecha: formatDateForInput(ciclo.fecha_cosecha),
            cantidad_siembra: ciclo.cantidad_siembra || '',
            densidad: ciclo.densidad || '',
            biomasa_cosecha: ciclo.biomasa_cosecha || '',
            tipo_siembra: ciclo.tipo_siembra || '',
            id_tipo_alimentacion: ciclo.id_tipo_alimentacion || '',
            nombre_tipo_alimentacion: ciclo.nombre_tipo_alimentacion || '',
            promedio_incremento_peso: ciclo.promedio_incremento_peso || '',
            libras_por_hectarea: ciclo.libras_por_hectarea || '',
            ruta_pdf: ciclo.ruta_pdf || '',
            estado: ciclo.estado || 'EN_CURSO'
          });
          setError('');
        } else {
          throw new Error(result.message || "Error al obtener datos del ciclo");
        }
      } catch (err) {
        console.error("Error fetching ciclo data:", err);
        setError(err.message || "No se pudieron cargar los datos del ciclo.");
      } finally {
        setLoadingCiclo(false);
      }
    };

    if (idCompania && id) {
      fetchCicloData();
    } else {
      setLoadingCiclo(false);
    }
  }, [idCompania, id, API_BASE_URL]);

  // Cargar piscinas disponibles
  useEffect(() => {
    const fetchPiscinas = async () => {
      if (!idCompania) {
        setError("No se pudo obtener la información de la compañía del usuario.");
        setLoadingPiscinas(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/module/piscinas.php?id_compania=${idCompania}`, {
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
        } else {
          throw new Error(result.message || "Error al obtener piscinas");
        }
      } catch (err) {
        console.error("Error fetching piscinas:", err);
        setError(err.message || "No se pudieron cargar las piscinas.");
      } finally {
        setLoadingPiscinas(false);
      }
    };

    if (idCompania) {
      fetchPiscinas();
    } else {
      setLoadingPiscinas(false);
    }
  }, [idCompania, API_BASE_URL]);

  const handleCancel = () => {
    navigate('/layout/dashboard/monitoreo-ciclos');
  };

  if (loadingCiclo || loadingPiscinas) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="form-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Consultar Ciclo Productivo</h1>
        <p className="text-gray-600">Visualización de la información del ciclo productivo.</p>
      </div>

      {error && (
        <div className="header-user mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-3">
          <svg className="info w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {(!idCompania) && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p><strong>⚠️ Información de usuario incompleta</strong></p>
          <p className="text-sm mt-1">
            No se pudo cargar la información de la compañía. Por favor, cierre sesión e inicie sesión nuevamente.
          </p>
        </div>
      )}

      {piscinas.length === 0 && !error && (
        <div className="header-user mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-3">
          <svg className="info w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p><strong>No hay piscinas disponibles.</strong></p>
            <p className="text-sm mt-1">
              No se encontraron piscinas en el sistema.
            </p>
          </div>
        </div>
      )}

      <form className="space-y-6">
          <div>
            <label htmlFor="id_piscina" className="block text-sm font-medium text-gray-700 mb-2">
              Piscina *
            </label>
            <select
              id="id_piscina"
              name="id_piscina"
              value={formData.id_piscina}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              disabled
            >
              <option value="">
                {piscinas.length === 0 
                  ? "No hay piscinas disponibles" 
                  : "Seleccione una piscina"
                }
              </option>
              {piscinas.map(piscina => (
                <option key={piscina.id_piscina} value={piscina.id_piscina}>
                  {piscina.codigo} - {piscina.hectareas} ha - {piscina.ubicacion}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Seleccione la piscina donde se realiza el ciclo productivo
            </p>
          </div>        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fecha_siembra" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Siembra *
            </label>
            <input
              type="date"
              id="fecha_siembra"
              name="fecha_siembra"
              value={formData.fecha_siembra}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Fecha en la que se realiza la siembra
            </p>
          </div>

          <div>
            <label htmlFor="fecha_cosecha" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Cosecha {formData.estado === 'FINALIZADO' && <span className="text-red-600">*</span>}
            </label>
            <input
              type="date"
              id="fecha_cosecha"
              name="fecha_cosecha"
              value={formData.fecha_cosecha}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1 leyenda">
              {formData.estado === 'FINALIZADO' 
                ? 'Fecha de cosecha es obligatoria para ciclos finalizados'
                : 'Fecha estimada de cosecha (opcional)'
              }
            </p>
          </div>

          <div>
            <label htmlFor="cantidad_siembra" className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad de Siembra *
            </label>
            <input
              type="number"
              id="cantidad_siembra"
              name="cantidad_siembra"
              value={formData.cantidad_siembra}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Número de larvas o individuos sembrados
            </p>
          </div>

          <div>
            <label htmlFor="densidad" className="block text-sm font-medium text-gray-700 mb-2">
              Densidad (por hectárea) * <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
            </label>
            <input
              type="text"
              id="densidad"
              name="densidad"
              value={formData.densidad}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Cantidad de siembra ÷ Hectáreas de la piscina
              {formData.id_piscina && piscinas.length > 0 && (() => {
                const piscinaSeleccionada = piscinas.find(p => p.id_piscina == formData.id_piscina);
                return piscinaSeleccionada ? ` (${piscinaSeleccionada.hectareas} ha)` : '';
              })()}
            </p>
          </div>

          <div>
            <label htmlFor="tipo_siembra" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Siembra *
            </label>
            <input
              type="text"
              id="tipo_siembra"
              name="tipo_siembra"
              value={formData.tipo_siembra}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Tipo o método de siembra utilizado
            </p>
          </div>

          <div>
            <label htmlFor="id_tipo_alimentacion" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Alimentación *
            </label>
            <input
              type="text"
              id="id_tipo_alimentacion"
              name="id_tipo_alimentacion"
              value={formData.nombre_tipo_alimentacion}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Tipo de alimentación a utilizar en el ciclo productivo
            </p>
          </div>

          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              disabled
            >
              <option value="EN_CURSO">En Curso</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Estado actual del ciclo productivo
            </p>
          </div>
        </div>

        {formData.estado === 'FINALIZADO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="biomasa_cosecha" className="block text-sm font-medium text-gray-700 mb-2">
                Cosecha en libras
              </label>
              <input
                type="text"
                id="biomasa_cosecha"
                name="biomasa_cosecha"
                value={formData.biomasa_cosecha}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1 leyenda">
                Cantidad total de libras de camarones cosechadas
              </p>
            </div>

            <div>
              <label htmlFor="libras_por_hectarea" className="block text-sm font-medium text-gray-700 mb-2">
                Libras por Hectárea
              </label>
              <input
                type="text"
                id="libras_por_hectarea"
                name="libras_por_hectarea"
                value={formData.libras_por_hectarea}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1 leyenda">
                Biomasa de cosecha ÷ Hectáreas de la piscina
                {formData.id_piscina && piscinas.length > 0 && (() => {
                  const piscinaSeleccionada = piscinas.find(p => p.id_piscina == formData.id_piscina);
                  return piscinaSeleccionada ? ` (${piscinaSeleccionada.hectareas} ha)` : '';
                })()}
              </p>
            </div>

            <div>
              <label htmlFor="promedio_incremento_peso" className="block text-sm font-medium text-gray-700 mb-2">
                Promedio de Incremento de Peso
              </label>
              <input
                type="text"
                id="promedio_incremento_peso"
                name="promedio_incremento_peso"
                value={formData.promedio_incremento_peso}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1 leyenda">
                Promedio de incremento de peso calculado automáticamente de todas las muestras registradas
              </p>
            </div>

            <div>
              <label htmlFor="ruta_pdf" className="block text-sm font-medium text-gray-700 mb-2">
                Informe PDF
              </label>
              {formData.ruta_pdf ? (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `${API_BASE_URL}/${formData.ruta_pdf}`;
                      link.download = formData.ruta_pdf.split('/').pop();
                      link.click();
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200 inline-flex items-center gap-2"
                    title="Descargar PDF"
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
                    Descargar PDF
                  </button>
                  <p className="text-xs text-gray-500 mt-2 leyenda">
                    Informe PDF del ciclo productivo cargado
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-2 leyenda">
                  No hay informe PDF cargado para este ciclo
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-1 flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Volver
          </button>
        </div>
      </form>
    </div>
  );
}
