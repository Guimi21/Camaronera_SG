import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import {
  validarFormulario,
  construirPayloadCreacion,
  construirPayloadEdicion,
  procesarMensajeError
} from '../../../utils/companiaFormHelpers';

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

export default function CompaniaForm() {
  const navigate = useNavigate();
  const { idCompania } = useParams();
  const { API_BASE_URL } = config;
  const { idUsuario } = useAuth();

  // Determinar si es modo edición
  const isEditMode = !!idCompania;

  const [compania, setCompania] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    estado: 'ACTIVA'
  });
  
  const [loading, setLoading] = useState(isEditMode ? true : false);
  const [error, setError] = useState('');

  // Hacer scroll al inicio cuando hay un error
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Cargar datos de la compañía a editar en modo edición
  useEffect(() => {
    if (isEditMode && idCompania && idUsuario) {
      fetchCompaniaData();
    }
  }, [idCompania, idUsuario, isEditMode]);

  const fetchCompaniaData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/module/companias.php?id_usuario=${idUsuario}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Buscar la compañía específica en la lista
        const companiaEncontrada = result.data.find(c => 
          String(c.id_compania) === String(idCompania)
        );
        
        if (companiaEncontrada) {
          setCompania(companiaEncontrada);
          setFormData({
            nombre: companiaEncontrada.nombre || '',
            direccion: companiaEncontrada.direccion || '',
            telefono: companiaEncontrada.telefono || '',
            estado: companiaEncontrada.estado || 'ACTIVA'
          });
        } else {
          throw new Error('Compañía no encontrada en la lista');
        }
      } else {
        throw new Error('Error al obtener compañías');
      }
    } catch (err) {
      console.error('Error fetching compania data:', err);
      setError(err.message || 'No se pudo cargar la compañía');
    } finally {
      setLoading(false);
    }
  };



  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'telefono' 
      ? value.replaceAll(/\D/g, '').slice(0, 10)
      : value;
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    setError('');
  };

  const handleScrollToTop = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const handleValidationError = (mensaje) => {
    setError(mensaje);
    handleScrollToTop();
  };

  const handleAPICall = async (method, payload) => {
    const response = await fetch(`${API_BASE_URL}/module/companias.php`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return response;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario
    const validacion = validarFormulario(formData);
    if (!validacion.valido) {
      handleValidationError(validacion.error);
      return;
    }

    if (!idUsuario) {
      handleValidationError('No se pudo obtener la información del usuario');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = isEditMode
        ? construirPayloadEdicion(formData, idCompania, idUsuario)
        : construirPayloadCreacion(formData, idUsuario);

      const method = isEditMode ? 'PUT' : 'POST';
      const response = await handleAPICall(method, payload);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Error HTTP: ${response.status}`);
      }

      if (result.success) {
        navigate('/layout/dashboard/companias');
      } else {
        throw new Error(result.message || (isEditMode ? 'Error al actualizar' : 'Error al crear'));
      }
    } catch (err) {
      console.error('Error:', err);
      const detailedError = procesarMensajeError(err.message);
      setError(detailedError);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) {
      return (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Guardando...
        </>
      );
    }
    return isEditMode ? 'Guardar Cambios' : 'Guardar Compañía';
  };

  const handleCancel = () => {
    navigate('/layout/dashboard/companias');
  };

  if (isEditMode && loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Cargando...</span>
      </div>
    );
  }

  if (isEditMode && !compania) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-red-700">Compañía no encontrada</div>
      </div>
    );
  }

  return (
    <div className="form-container min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">
              {isEditMode ? 'Editar Compañía' : 'Registrar Nueva Compañía'}
            </h1>
            <p className="text-gray-600">
              {isEditMode 
                ? `Modifique los datos de la compañía: ${compania?.nombre}`
                : 'Complete el formulario para agregar una nueva compañía al sistema.'
              }
            </p>
          </div>

          {error && (
            <div className="header-user mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-3">
              <svg className="info w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Información General */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Compañía *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese el nombre de la compañía"
                />
                {formData.nombre === '' && <ValidationMessage fieldName="un Nombre de la Compañía" />}
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  El nombre debe ser único y descriptivo
                </p>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese la dirección"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  Dirección física de la compañía (opcional)
                </p>
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  maxLength="10"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 0999999999"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  Número de contacto de la compañía (10 dígitos, opcional). Ingresados: {formData.telefono.length}/10
                </p>
              </div>
            </div>

            {/* Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVA">Activa</option>
                  <option value="INACTIVA">Inactiva</option>
                </select>
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  Estado operativo de la compañía
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-1 flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getButtonText()}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
