import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';

export default function GrupoEmpresarialForm() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar mensajes al escribir
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre.trim()) {
      setError('El nombre del grupo empresarial es obligatorio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Datos a enviar
      const dataToSend = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null
      };

      const response = await fetch(`${API_BASE_URL}/module/grupos_empresariales.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 409 && result.code === 'DUPLICATE_NAME') {
          throw new Error(result.message || 'El nombre del grupo empresarial ya existe');
        } else if (response.status === 400) {
          throw new Error(result.message || 'Datos inválidos. Por favor, verifique los campos');
        } else {
          throw new Error(result.message || `Error HTTP: ${response.status}`);
        }
      }

      if (result.success) {
        // Limpiar formulario
        setFormData({
          nombre: '',
          descripcion: ''
        });

        // Redirigir inmediatamente
        navigate('/layout/dashboard/grupos-empresariales');
      } else {
        throw new Error(result.message || 'Error al crear el grupo empresarial');
      }
    } catch (err) {
      console.error('Error creating grupo empresarial:', err);
      setError(err.message || 'No se pudo crear el grupo empresarial. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/layout/dashboard/grupos-empresariales');
  };

  // Componente para mostrar mensaje de validación
  const ValidationMessage = ({ fieldName }) => (
    <div className="validation-message">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Ingresa {fieldName}</span>
    </div>
  );

  return (
    <div className="form-container min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">
              Registrar Nuevo Grupo Empresarial
            </h1>
            <p className="text-gray-600">
              Complete el formulario para agregar un nuevo grupo empresarial al sistema.
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información General */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Grupo Empresarial *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese el nombre del grupo empresarial"
                  required
                />
                {formData.nombre === '' && <ValidationMessage fieldName="un Nombre del Grupo Empresarial" />}
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  El nombre debe ser único y descriptivo
                </p>
              </div>
            </div>

            {/* Descripción */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese una descripción del grupo empresarial"
                  rows="5"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  Descripción adicional del grupo empresarial (opcional)
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
                    Guardar Grupo
                  </>
                )}
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
