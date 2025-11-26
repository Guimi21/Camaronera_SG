import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';

// Componente para mostrar mensaje de validación
const ValidationMessage = ({ fieldName }) => (
  <div className="validation-message">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>Ingresa {fieldName}</span>
  </div>
);

ValidationMessage.propTypes = {
  fieldName: PropTypes.string.isRequired
};

export default function BalanceadoForm() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania, idUsuario } = useAuth();
  
  const [formData, setFormData] = useState({
    nombre: '',
    unidad: 'lb',
    estado: 'ACTIVO'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hacer scroll al inicio cuando hay un error
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre.trim()) {
      setError('El nombre del tipo de balanceado es requerido.');
      return;
    }
    
    if (!formData.unidad.trim()) {
      setError('La unidad es requerida.');
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
        nombre: formData.nombre.trim(),
        unidad: formData.unidad.trim(),
        estado: formData.estado,
        id_compania: idCompania,
        id_usuario_crea: idUsuario,
        id_usuario_actualiza: idUsuario
      };

      const response = await fetch(`${API_BASE_URL}/module/tipos_balanceado.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Éxito - redirigir al monitoreo de balanceados
        navigate('/layout/dashboard/monitoreo-balanceados');
      } else {
        setError(result.message || 'Error al crear el tipo de balanceado. Por favor intente nuevamente.');
      }
    } catch (error) {
      console.error('Error creating tipo balanceado:', error);
      setError('Error de conexión. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/layout/dashboard/monitoreo-balanceados');
  };

  return (
    <div className="form-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Agregar Nuevo Tipo de Balanceado</h1>
        <p className="text-gray-600">Complete los campos para registrar un nuevo tipo de balanceado en el sistema.</p>
      </div>

      {error && (
        <div className="header-user mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-3">
          <svg className="info w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Nombre del Tipo de Balanceado */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Tipo de Balanceado *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Balanceado Premium, Iniciador, etc."
              maxLength={50}
              required
            />
            {formData.nombre === '' && <ValidationMessage fieldName="un Nombre del Tipo de Balanceado" />}
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Nombre del tipo de balanceado (máximo 50 caracteres)
            </p>
          </div>

          {/* Unidad */}
          <div>
            <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 mb-2">
              Unidad *
            </label>
            <input
              type="text"
              id="unidad"
              name="unidad"
              value={formData.unidad}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Unidad de medida estándar para balanceado
            </p>
          </div>

        </div>

        {/* Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Estado del tipo de balanceado
            </p>
          </div>
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
              'Guardando Tipo de Balanceado...'
            ) : (
              'Guardar Tipo de Balanceado'
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
