import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from '../../../config';

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

export default function PerfilForm() {
  const navigate = useNavigate();
  const { idPerfil } = useParams();
  const { API_BASE_URL } = config;

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    menus: [],
    estado: 'ACTIVO'
  });

  const [menusDisponibles, setMenusDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Hacer scroll al inicio cuando hay un error
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Cargar datos del perfil si es edición
  useEffect(() => {
    if (idPerfil) {
      setIsEditing(true);
      fetchPerfil();
    }
    fetchMenus();
  }, [idPerfil]);

  const fetchPerfil = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/module/perfiles.php?id_perfil=${idPerfil}`, {
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

      if (result.success && result.data && result.data.length > 0) {
        const perfil = result.data[0];
        setFormData({
          nombre: perfil.nombre || '',
          descripcion: perfil.descripcion || '',
          menus: perfil.menus ? perfil.menus.map(m => m.id_menu) : [],
          estado: perfil.estado || 'ACTIVO'
        });
      } else {
        throw new Error('Perfil no encontrado');
      }

    } catch (err) {
      console.error('Error fetching perfil:', err);
      setError(err.message || 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/module/menus.php`, {
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
        setMenusDisponibles(result.data);
      }
    } catch (err) {
      console.error('Error fetching menus:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleMenuChange = (id_menu) => {
    setFormData(prev => {
      const menus = prev.menus.includes(id_menu)
        ? prev.menus.filter(m => m !== id_menu)
        : [...prev.menus, id_menu];
      return { ...prev, menus };
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      setError('El nombre del perfil es obligatorio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        menus: formData.menus,
        estado: formData.estado
      };

      if (isEditing) {
        payload.id_perfil = Number.parseInt(idPerfil);
      }

      const response = await fetch(`${API_BASE_URL}/module/perfiles.php`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        navigate('/layout/dashboard/perfiles');
      } else {
        throw new Error(result.message || 'Error al guardar el perfil');
      }

    } catch (err) {
      console.error('Error saving perfil:', err);
      setError(err.message || 'No se pudo guardar el perfil. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/directivo/perfiles');
  };

  const getButtonText = () => {
    if (loading) {
      return isEditing ? 'Actualizando...' : 'Guardando...';
    }
    return isEditing ? 'Actualizar Perfil' : 'Guardar Perfil';
  };

  return (
    <div className="form-container min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">
              {isEditing ? 'Editar Perfil' : 'Registrar Nuevo Perfil'}
            </h1>
            <p className="text-gray-600">
              {isEditing 
                ? 'Actualice la información del perfil del sitio web.' 
                : 'Complete el formulario para agregar un nuevo perfil al sistema.'}
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
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">Nombre del Perfil *</label>
                <input 
                  id="nombre"
                  type="text" 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg" 
                  placeholder="Ej: Administrador, Usuario, Visitante, etc." 
                  required 
                />
                {formData.nombre === '' && <ValidationMessage fieldName="un Nombre de Perfil" />}
                <p className="leyenda text-sm text-gray-500 mt-1">Nombre único y descriptivo del perfil.</p>
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea 
                  id="descripcion"
                  name="descripcion" 
                  value={formData.descripcion} 
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-vertical" 
                  placeholder="Describa el propósito y rol del perfil en el sistema..."
                  rows="5"
                />
                <p className="leyenda text-sm text-gray-500 mt-1">Descripción detallada del perfil (opcional).</p>
              </div>

              <div>
                <label htmlFor="menus" className="block text-sm font-medium text-gray-700 mb-2">Menús Asociados</label>
                <fieldset id="menus" className="space-y-2 border border-gray-300 rounded-lg bg-gray-50">
                  {menusDisponibles.length > 0 ? (
                    menusDisponibles.map(menu => (
                      <div key={menu.id_menu} className="flex items-center p-2">
                        <input
                          type="checkbox"
                          id={`menu-${menu.id_menu}`}
                          checked={formData.menus.includes(menu.id_menu)}
                          onChange={() => handleMenuChange(menu.id_menu)}
                        />
                        <label htmlFor={`menu-${menu.id_menu}`} className="ml-2 text-sm text-gray-700 cursor-pointer font-medium">
                          {menu.nombre}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-3">No hay menús disponibles</p>
                    )}
                </fieldset>
                <p className="leyenda text-sm text-gray-500 mt-1">Seleccione los menús que tendrá acceso este perfil (opcional).</p>
              </div>

              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select id="estado"
                  name="estado" 
                  value={formData.estado} 
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
                <p className="leyenda text-sm text-gray-500 mt-1">Estado del perfil en el sistema.</p>
              </div>
            </div>

            <div className="mt-1 flex flex-col sm:flex-row gap-4 pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {getButtonText()}
              </button>

              <button 
                type="button" 
                onClick={handleCancel} 
                disabled={loading}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50"
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
