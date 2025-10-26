import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';

export default function UsuarioForm() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idUsuario } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    password: '',
    perfiles: [], // Array de IDs de perfiles seleccionados
    companias: [], // Array de IDs de compañías seleccionadas
    estado: 'A'
  });

  const [perfilesDisponibles, setPerfilesDisponibles] = useState([]);
  const [companiasDisponibles, setCompaniasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar perfiles disponibles
  useEffect(() => {
    fetchPerfiles();
    fetchCompanias();
  }, []);

  const fetchPerfiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/module/perfiles.php`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setPerfilesDisponibles(result.data);
      }
    } catch (err) {
      console.error('Error fetching perfiles:', err);
    }
  };

  const fetchCompanias = async () => {
    try {
      if (!idUsuario) return;

      const response = await fetch(`${API_BASE_URL}/module/companias.php?id_usuario=${idUsuario}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setCompaniasDisponibles(result.data);
      }
    } catch (err) {
      console.error('Error fetching companias:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMessage('');
  };

  const handlePerfilChange = (id_perfil) => {
    setFormData(prev => {
      const perfiles = prev.perfiles.includes(id_perfil)
        ? prev.perfiles.filter(p => p !== id_perfil)
        : [...prev.perfiles, id_perfil];
      return { ...prev, perfiles };
    });
    setError('');
    setSuccessMessage('');
  };

  const handleCompaniaChange = (id_compania) => {
    setFormData(prev => {
      const companias = prev.companias.includes(id_compania)
        ? prev.companias.filter(c => c !== id_compania)
        : [...prev.companias, id_compania];
      return { ...prev, companias };
    });
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!formData.username.trim()) {
      setError('El usuario (username) es obligatorio');
      return;
    }
    if (!formData.password) {
      setError('La contraseña es obligatoria');
      return;
    }

    if (formData.perfiles.length === 0) {
      setError('Debe seleccionar al menos un perfil');
      return;
    }

    if (formData.companias.length === 0) {
      setError('Debe seleccionar al menos una compañía');
      return;
    }

    if (!idUsuario) {
      setError('No se pudo obtener la información del usuario autenticado');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        username: formData.username.trim(),
        // Por el momento guardamos la contraseña tal cual en password_hash
        password: formData.password,
        estado: formData.estado,
        perfiles: formData.perfiles,
        companias: formData.companias,
        id_usuario: idUsuario
      };

      const response = await fetch(`${API_BASE_URL}/module/usuarios.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Usuario creado exitosamente');
        // Redirigir a la lista de usuarios
        navigate('/layout/dashboard/usuarios');
      } else {
        throw new Error(result.message || 'Error al crear el usuario');
      }

    } catch (err) {
      console.error('Error creating usuario:', err);
      setError(err.message || 'No se pudo crear el usuario. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/layout/dashboard/usuarios');

  return (
    <div className="form-container min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">Registrar Nuevo Usuario</h1>
            <p className="text-gray-600">Complete el formulario para agregar un nuevo usuario al sistema.</p>
          </div>

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{successMessage}</div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Nombre completo" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario (username) *</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="usuario123" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Contraseña" required />
                <p className="leyenda text-sm text-gray-500 mt-1">Por ahora la contraseña se almacenará tal cual en la base de datos.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Perfiles *</label>
                <div className="space-y-2 border border-gray-300 rounded-lg bg-gray-50">
                  {perfilesDisponibles.length > 0 ? (
                    perfilesDisponibles.map(perfil => (
                      <div key={perfil.id_perfil} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`perfil-${perfil.id_perfil}`}
                          checked={formData.perfiles.includes(perfil.id_perfil)}
                          onChange={() => handlePerfilChange(perfil.id_perfil)}
                          className="checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`perfil-${perfil.id_perfil}`} className="ml-2 text-sm text-gray-700">
                          {perfil.nombre}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Cargando perfiles...</p>
                  )}
                </div>
                <p className="leyenda text-sm text-gray-500 mt-1">Seleccione al menos un perfil para el usuario.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compañías *</label>
                <div className="space-y-2 border border-gray-300 rounded-lg bg-gray-50">
                  {companiasDisponibles.length > 0 ? (
                    companiasDisponibles.map(compania => (
                      <div key={compania.id_compania} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`compania-${compania.id_compania}`}
                          checked={formData.companias.includes(compania.id_compania)}
                          onChange={() => handleCompaniaChange(compania.id_compania)}
                          className="checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`compania-${compania.id_compania}`} className="ml-2 text-sm text-gray-700">
                          {compania.nombre}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Cargando compañías...</p>
                  )}
                </div>
                <p className="leyenda text-sm text-gray-500 mt-1">Seleccione al menos una compañía para el usuario.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                <select name="estado" value={formData.estado} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg">
                  <option value="A">Activo</option>
                  <option value="I">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="mt-1 flex flex-col sm:flex-row gap-4 pt-6">
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar Usuario'}
              </button>

              <button type="button" onClick={handleCancel} disabled={loading}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
