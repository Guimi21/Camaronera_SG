import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';

export default function CompaniaForm() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idUsuario } = useAuth(); // Obtener ID de usuario para obtener su grupo empresarial
  
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    estado: 'ACTIVA'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hacer scroll al inicio cuando hay un error
  React.useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Función para obtener los campos requeridos vacíos
  const obtenerCamposVacios = () => {
    const camposVacios = [];

    // Validar nombre
    if (!formData.nombre || formData.nombre.trim() === '') {
      camposVacios.push({
        campo: 'Nombre de la Compañía',
        tipo: 'vacio',
        razon: 'Este campo es obligatorio'
      });
    }

    return camposVacios;
  };

  // Función para validar teléfono
  const validarTelefono = (telefono) => {
    if (!telefono || telefono.trim() === '') {
      return { valido: true, razon: '' }; // El teléfono es opcional
    }
    
    const telefonoSinEspacios = telefono.replace(/\s/g, '');
    const soloDigitos = /^\d+$/.test(telefonoSinEspacios);
    const tieneExactamente10 = telefonoSinEspacios.length === 10;
    
    if (!soloDigitos) {
      return { valido: false, razon: 'El teléfono solo puede contener dígitos' };
    }
    
    if (!tieneExactamente10) {
      return { valido: false, razon: `El teléfono debe tener exactamente 10 dígitos (actualmente tiene ${telefonoSinEspacios.length})` };
    }
    
    return { valido: true, razon: '' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si es el campo de teléfono, permitir solo dígitos
    if (name === 'telefono') {
      const soloDigitos = value.replace(/\D/g, '');
      // Limitar a máximo 10 dígitos
      const telefonoLimitado = soloDigitos.slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: telefonoLimitado
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Limpiar mensajes al escribir
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar si hay campos vacíos
    const camposVacios = obtenerCamposVacios();
    if (camposVacios.length > 0) {
      // Hacer scroll al inicio para mostrar el mensaje de campos pendientes
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
      return;
    }

    // Validar teléfono si fue ingresado
    if (formData.telefono.trim()) {
      const validacionTelefono = validarTelefono(formData.telefono);
      if (!validacionTelefono.valido) {
        setError(`Teléfono: ${validacionTelefono.razon}`);
        // Hacer scroll al inicio inmediatamente
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0);
        return;
      }
    }

    if (!idUsuario) {
      setError('No se pudo obtener la información del usuario');
      // Hacer scroll al inicio inmediatamente
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Datos a enviar
      const dataToSend = {
        nombre: formData.nombre.trim(),
        direccion: formData.direccion.trim() || null,
        telefono: formData.telefono.trim() || null,
        estado: formData.estado,
        id_usuario: idUsuario // Enviar el ID del usuario para obtener su grupo empresarial
      };

      const response = await fetch(`${API_BASE_URL}/module/companias.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (result.success) {
        // Limpiar formulario
        setFormData({
          nombre: '',
          direccion: '',
          telefono: '',
          estado: 'ACTIVA'
        });

        // Redirigir inmediatamente
        navigate('/layout/dashboard/companias');
      } else {
        throw new Error(result.message || 'Error al crear la compañía');
      }
    } catch (err) {
      console.error('Error creating compania:', err);
      setError(err.message || 'No se pudo crear la compañía. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/layout/dashboard/companias');
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
              Registrar Nueva Compañía
            </h1>
            <p className="text-gray-600">
              Complete el formulario para agregar una nueva compañía al sistema.
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
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar Compañía'
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
