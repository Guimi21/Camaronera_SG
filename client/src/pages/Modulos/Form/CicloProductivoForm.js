import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';

export default function CicloProductivoForm() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania, idUsuario } = useAuth();
  
  const [formData, setFormData] = useState({
    id_piscina: '',
    fecha_siembra: new Date().toISOString().split('T')[0],
    fecha_cosecha: '',
    cantidad_siembra: '',
    densidad: '',
    tipo_siembra: '',
    estado: 'EN_CURSO'
  });
  
  const [piscinas, setPiscinas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPiscinas, setLoadingPiscinas] = useState(true);
  const [error, setError] = useState('');

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
          setError('');
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

  // Efecto para recalcular densidad cuando cambien los datos relevantes
  useEffect(() => {
    if (formData.cantidad_siembra && formData.id_piscina && piscinas.length > 0) {
      const densidadCalculada = calcularDensidad(formData.cantidad_siembra, formData.id_piscina);
      if (densidadCalculada !== formData.densidad) {
        setFormData(prevData => ({
          ...prevData,
          densidad: densidadCalculada
        }));
      }
    } else if (formData.densidad !== '') {
      // Si no hay datos para calcular, limpiar el campo de densidad
      setFormData(prevData => ({
        ...prevData,
        densidad: ''
      }));
    }
  }, [formData.cantidad_siembra, formData.id_piscina, piscinas]);

  // Función para calcular densidad
  const calcularDensidad = (cantidadSiembra, idPiscina) => {
    if (!cantidadSiembra || !idPiscina) return '';
    
    const piscinaSeleccionada = piscinas.find(p => p.id_piscina == idPiscina);
    if (!piscinaSeleccionada || !piscinaSeleccionada.hectareas) return '';
    
    const cantidadNum = parseFloat(cantidadSiembra);
    const hectareasNum = parseFloat(piscinaSeleccionada.hectareas);
    
    if (isNaN(cantidadNum) || isNaN(hectareasNum) || hectareasNum === 0) return '';
    
    const densidad = cantidadNum / hectareasNum;
    return densidad.toFixed(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validación para cantidad_siembra
    if (name === 'cantidad_siembra') {
      const numericValue = parseFloat(value);
      if (value !== '' && (isNaN(numericValue) || numericValue <= 0)) {
        return;
      }
    }
    
    // Crear nuevo formData con el cambio
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    // Calcular densidad automáticamente si cambia la cantidad de siembra o la piscina
    if (name === 'cantidad_siembra' || name === 'id_piscina') {
      const cantidadSiembra = name === 'cantidad_siembra' ? value : formData.cantidad_siembra;
      const idPiscina = name === 'id_piscina' ? value : formData.id_piscina;
      
      newFormData.densidad = calcularDensidad(cantidadSiembra, idPiscina);
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_piscina) {
      setError('Debe seleccionar una piscina.');
      return;
    }
    
    if (!formData.fecha_siembra) {
      setError('La fecha de siembra es requerida.');
      return;
    }
    
    if (!formData.cantidad_siembra || parseFloat(formData.cantidad_siembra) <= 0) {
      setError('La cantidad de siembra debe ser un número positivo.');
      return;
    }
    
    if (!formData.densidad) {
      setError('La densidad no pudo calcularse. Verifica la cantidad de siembra y la piscina seleccionada.');
      return;
    }
    
    if (!formData.tipo_siembra.trim()) {
      setError('El tipo de siembra es requerido.');
      return;
    }
    
    if (!idCompania || !idUsuario) {
      setError('No se pudo obtener la información del usuario o compañía.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        id_piscina: parseInt(formData.id_piscina),
        fecha_siembra: formData.fecha_siembra,
        fecha_cosecha: formData.fecha_cosecha || null,
        cantidad_siembra: parseInt(formData.cantidad_siembra),
        densidad: parseFloat(formData.densidad),
        tipo_siembra: formData.tipo_siembra.trim(),
        estado: formData.estado,
        id_compania: idCompania,
        id_usuario_crea: idUsuario,
        id_usuario_actualiza: idUsuario // Mismo usuario que crea el registro
      };

      const response = await fetch(`${API_BASE_URL}/module/ciclos.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        navigate('/layout/dashboard/monitoreo-ciclos');
      } else {
        setError(result.message || 'Error al crear el ciclo productivo. Por favor intente nuevamente.');
      }
    } catch (error) {
      console.error('Error creating ciclo:', error);
      setError('Error de conexión. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/layout/dashboard/monitoreo-ciclos');
  };

  return (
    <div className="form-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Agregar Nuevo Ciclo Productivo</h1>
        <p className="text-gray-600">Complete los campos para registrar un nuevo ciclo productivo en el sistema.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {(!idCompania || !idUsuario) && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p><strong>⚠️ Información de usuario incompleta</strong></p>
          <p className="text-sm mt-1">
            No se pudo cargar la información de la compañía o del usuario. Por favor, cierre sesión e inicie sesión nuevamente.
          </p>
          <p className="text-xs mt-2 font-mono">
            Debug: idCompania={idCompania || 'undefined'}, idUsuario={idUsuario || 'undefined'}
          </p>
        </div>
      )}

      {!loadingPiscinas && piscinas.length === 0 && !error && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p><strong>No hay piscinas disponibles.</strong></p>
          <p className="text-sm mt-1">
            Para agregar ciclos productivos, primero debes crear piscinas en el sistema.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="id_piscina" className="block text-sm font-medium text-gray-700 mb-2">
            Piscina *
          </label>
          {loadingPiscinas ? (
            <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
              Cargando piscinas...
            </div>
          ) : (
            <select
              id="id_piscina"
              name="id_piscina"
              value={formData.id_piscina}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={piscinas.length === 0}
              required
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
          )}
          <p className="text-xs text-gray-500 mt-1 leyenda">
            Seleccione la piscina donde se realizará el ciclo productivo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fecha_siembra" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Siembra *
            </label>
            <input
              type="date"
              id="fecha_siembra"
              name="fecha_siembra"
              value={formData.fecha_siembra}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Fecha en la que se realiza la siembra
            </p>
          </div>

          <div>
            <label htmlFor="fecha_cosecha" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Cosecha (Estimada)
            </label>
            <input
              type="date"
              id="fecha_cosecha"
              name="fecha_cosecha"
              value={formData.fecha_cosecha}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Fecha estimada de cosecha (opcional)
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
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 500000"
              min="1"
              step="1"
              required
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
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              placeholder="Se calcula automáticamente"
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
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Intensiva, Extensiva, Semi-intensiva"
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Tipo o método de siembra utilizado
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
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="EN_CURSO">En Curso</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Estado actual del ciclo productivo
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="submit"
            disabled={loading || loadingPiscinas || piscinas.length === 0}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-md font-medium text-white transition-colors duration-200 ${
              loading || loadingPiscinas || piscinas.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando Ciclo...
              </span>
            ) : (
              'Crear Ciclo Productivo'
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={loading || loadingPiscinas}
            className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
