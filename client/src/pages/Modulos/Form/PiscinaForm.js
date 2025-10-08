import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';

export default function PiscinaForm() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania, idUsuario } = useAuth();
  
  const [formData, setFormData] = useState({
    codigo: '',
    hectareas: '',
    ubicacion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Para el campo hectareas, validar que sea un número positivo
    if (name === 'hectareas') {
      const numericValue = parseFloat(value);
      if (value !== '' && (isNaN(numericValue) || numericValue <= 0)) {
        return; // No actualizar si no es un número válido positivo
      }
    }
    
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.codigo.trim()) {
      setError('El código de la piscina es requerido.');
      return;
    }
    
    if (!formData.hectareas || parseFloat(formData.hectareas) <= 0) {
      setError('Las hectáreas deben ser un número positivo.');
      return;
    }
    
    if (!formData.ubicacion.trim()) {
      setError('La ubicación es requerida.');
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
        codigo: formData.codigo.trim(),
        hectareas: parseFloat(formData.hectareas),
        ubicacion: formData.ubicacion.trim(),
        id_compania: idCompania,
        id_usuario_crea: idUsuario,
        id_usuario_actualiza: idUsuario
      };

      const response = await fetch(`${API_BASE_URL}/module/piscinas.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Éxito - redirigir al monitoreo de piscinas
        navigate('/layout/dashboard/monitoreo-piscinas');
      } else {
        setError(result.message || 'Error al crear la piscina. Por favor intente nuevamente.');
      }
    } catch (error) {
      console.error('Error creating piscina:', error);
      setError('Error de conexión. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/layout/dashboard/monitoreo-piscinas');
  };
  return (
    <div className="form-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Agregar Nueva Piscina</h1>
        <p className="text-gray-600">Complete los campos para registrar una nueva piscina en el sistema.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Código de la Piscina */}
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2">
              Código de la Piscina *
            </label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: P001, PISCINA-A, etc."
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Identificador único de la piscina (máximo 50 caracteres)
            </p>
          </div>

          {/* Hectáreas */}
          <div>
            <label htmlFor="hectareas" className="block text-sm font-medium text-gray-700 mb-2">
              Hectáreas *
            </label>
            <input
              type="number"
              id="hectareas"
              name="hectareas"
              value={formData.hectareas}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 2.5"
              min="0.01"
              step="0.01"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Área de la piscina en hectáreas
            </p>
          </div>

        </div>

        {/* Ubicación */}
        <div>
          <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 mb-2">
            Ubicación *
          </label>
          <textarea
            id="ubicacion"
            name="ubicacion"
            value={formData.ubicacion}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Descripción de la ubicación de la piscina"
            rows={3}
            maxLength={255}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Describa la ubicación o referencias geográficas de la piscina (máximo 255 caracteres)
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-md font-medium text-white transition-colors duration-200 ${
              loading 
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
                Creando Piscina...
              </span>
            ) : (
              'Crear Piscina'
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
