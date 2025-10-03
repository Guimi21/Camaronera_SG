import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';

export default function CicloProductivoForm() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania, idUsuario } = useAuth();
  
  const [formData, setFormData] = useState({
    id_ciclo: '', // Reemplaza los campos de ciclo_productivo
    dias_cultivo: '',
    peso: '',
    inc: '',
    biomasa_lbs: '',
    balnova08: '',
    balnova12: '',
    balnova22: '',
    balanceado_acu: '',
    conversion_alimenticia: '',
    poblacion_actual: '',
    supervivencia: '',
    observaciones: '',
    fecha_seguimiento: ''
  });
  
  const [ciclosDisponibles, setCiclosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCiclos, setLoadingCiclos] = useState(true);
  const [error, setError] = useState('');

  // Función para cargar los ciclos productivos disponibles
  const fetchCiclosDisponibles = async () => {
    if (!idCompania) {
      setError("No se pudo obtener la información de la compañía del usuario.");
      setLoadingCiclos(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/module/ciclos.php?id_compania=${idCompania}`, {
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
        setCiclosDisponibles(result.data);
        setError('');
      } else {
        throw new Error(result.message || "Error al obtener ciclos productivos");
      }
    } catch (err) {
      console.error("Error fetching ciclos:", err);
      setError(err.message || "No se pudieron cargar los ciclos productivos.");
    } finally {
      setLoadingCiclos(false);
    }
  };

  // Cargar ciclos disponibles al montar el componente
  useEffect(() => {
    if (idCompania) {
      fetchCiclosDisponibles();
    } else {
      setLoadingCiclos(false);
    }
  }, [idCompania]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Log para debugging cuando se selecciona un ciclo
    if (name === 'id_ciclo') {
      console.log('Ciclo seleccionado ID:', value);
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo === value);
      if (cicloSeleccionado) {
        console.log('Datos del ciclo seleccionado:', cicloSeleccionado);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar que se haya seleccionado un ciclo
    if (!formData.id_ciclo) {
      setError('Debes seleccionar un ciclo productivo');
      setLoading(false);
      return;
    }

    // Validar que el usuario esté autenticado
    if (!idUsuario) {
      setError('No se pudo obtener la información del usuario autenticado');
      setLoading(false);
      return;
    }

    // Validar que se tenga la información de la compañía
    if (!idCompania) {
      setError('No se pudo obtener la información de la compañía del usuario');
      setLoading(false);
      return;
    }

    try {
      // Agregar el id_usuario e id_compania a los datos del formulario
      const dataToSend = {
        ...formData,
        id_usuario: idUsuario,
        id_compania: idCompania
      };
      
      console.log('Enviando datos:', dataToSend); // Log para debugging
      
      const response = await fetch(`${API_BASE_URL}/module/ciclosproductivos.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();
      console.log('Respuesta del servidor:', result); // Log para debugging
      
      if (response.ok && result.success) {
        // Redirigir de vuelta al panel directivo con mensaje de éxito
        navigate('/layout/directivo', { 
          state: { message: 'Registro de seguimiento creado exitosamente' } 
        });
      } else {
        setError(result.message || `Error al crear el registro (Status: ${response.status})`);
      }
    } catch (err) {
      console.error('Error completo:', err);
      setError('Error de conexión. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/layout/directivo');
  };

  return (
    <div className="form-container min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">
              Nuevo Registro de Seguimiento
            </h1>
            <p className="text-gray-600">
              Selecciona un ciclo productivo existente y completa los campos de seguimiento para agregar un nuevo registro.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!loadingCiclos && ciclosDisponibles.length === 0 && !error && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <p><strong>No hay ciclos productivos disponibles.</strong></p>
              <p className="text-sm mt-1">
                Para agregar registros de seguimiento, primero debes crear ciclos productivos en el sistema.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selección de Ciclo Productivo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Ciclo Productivo *
              </label>
              {loadingCiclos ? (
                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Cargando ciclos productivos...
                </div>
              ) : (
                <select
                  name="id_ciclo"
                  value={formData.id_ciclo}
                  onChange={handleChange}
                  required
                  disabled={ciclosDisponibles.length === 0}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">
                    {ciclosDisponibles.length === 0 
                      ? "No hay ciclos productivos disponibles" 
                      : "Seleccionar piscina y fecha de siembra"
                    }
                  </option>
                  {ciclosDisponibles.map(ciclo => (
                    <option key={ciclo.id_ciclo} value={ciclo.id_ciclo}>
                      Piscina {ciclo.codigo_piscina} - Siembra: {new Date(ciclo.fecha_siembra).toLocaleDateString('es-ES')} ({ciclo.hectareas} has, {ciclo.tipo_siembra}, Densidad: {ciclo.densidad}/ha)
                    </option>
                  ))}
                </select>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Selecciona el ciclo productivo al cual deseas agregar datos de seguimiento
              </p>
            </div>

            {/* Información de seguimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Cultivo
                </label>
                <input
                  type="number"
                  name="dias_cultivo"
                  value={formData.dias_cultivo}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 120"
                />
              </div>
            </div>

            {/* Información de producción */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (g)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="peso"
                  value={formData.peso}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 15.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inc.P (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="inc"
                  value={formData.inc}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biomasa (lbs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="biomasa_lbs"
                  value={formData.biomasa_lbs}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Población Actual
                </label>
                <input
                  type="number"
                  name="poblacion_actual"
                  value={formData.poblacion_actual}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 140000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supervivencia (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="supervivencia"
                  value={formData.supervivencia}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 93.33"
                />
              </div>
            </div>

            {/* Información de alimentación */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balnova 0.8 mm
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="balnova08"
                  value={formData.balnova08}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balnova 1.2 mm
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="balnova12"
                  value={formData.balnova12}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 750"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balnova 2.2
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="balnova22"
                  value={formData.balnova22}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balanceado Acum.
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="balanceado_acu"
                  value={formData.balanceado_acu}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 2250"
                />
              </div>
            </div>

            {/* Información adicional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversión Alimenticia
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="conversion_alimenticia"
                  value={formData.conversion_alimenticia}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 1.45"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Seguimiento
                </label>
                <input
                  type="date"
                  name="fecha_seguimiento"
                  value={formData.fecha_seguimiento}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresa cualquier observación relevante..."
              />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading || loadingCiclos || ciclosDisponibles.length === 0}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Registro
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading || loadingCiclos}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
