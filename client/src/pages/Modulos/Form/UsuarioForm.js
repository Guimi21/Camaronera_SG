import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import { useScrollToError } from '../../../hooks/useScrollToError';

export default function UsuarioForm() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idUsuario, perfilActivo } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    password: '',
    perfil: '', // ID del perfil seleccionado (solo uno)
    companias: [], // Array de IDs de compañías seleccionadas
    idGrupoEmpresarial: '', // ID del grupo empresarial (solo para Superadministrador)
    estado: 'A'
  });

  const [perfilesDisponibles, setPerfilesDisponibles] = useState([]);
  const [companiasDisponibles, setCompaniasDisponibles] = useState([]);
  const [gruposEmpresarialesDisponibles, setGruposEmpresarialesDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hook para hacer scroll al principio cuando hay error
  useScrollToError(error);

  // Cargar perfiles disponibles
  useEffect(() => {
    fetchPerfiles();
    fetchCompanias();
    if (perfilActivo === 'Superadministrador') {
      fetchGruposEmpresariales();
    }
  }, [perfilActivo]);

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
        // Filtrar para excluir el perfil "Superadministrador"
        const perfilesFiltered = result.data.filter(perfil => perfil.nombre !== 'Superadministrador');
        setPerfilesDisponibles(perfilesFiltered);
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

  const fetchGruposEmpresariales = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/module/grupos_empresariales.php`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setGruposEmpresarialesDisponibles(result.data);
      }
    } catch (err) {
      console.error('Error fetching grupos empresariales:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePerfilChange = (id_perfil) => {
    setFormData(prev => ({
      ...prev,
      perfil: String(id_perfil)
    }));
    setError('');
  };

  const handleCompaniaChange = (id_compania) => {
    setFormData(prev => {
      const companias = prev.companias.includes(id_compania)
        ? prev.companias.filter(c => c !== id_compania)
        : [...prev.companias, id_compania];
      return { ...prev, companias };
    });
    setError('');
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

    if (!formData.perfil) {
      setError('Debe seleccionar un perfil');
      return;
    }

    // Si es Superadministrador, se requiere seleccionar un grupo empresarial
    if (perfilActivo === 'Superadministrador' && !formData.idGrupoEmpresarial) {
      setError('Debe seleccionar un grupo empresarial');
      return;
    }

    // Si no es Superadministrador, se requiere al menos una compañía
    if (perfilActivo !== 'Superadministrador' && formData.companias.length === 0) {
      setError('Debe seleccionar al menos una compañía');
      return;
    }

    if (!idUsuario) {
      setError('No se pudo obtener la información del usuario autenticado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        username: formData.username.trim(),
        // Por el momento guardamos la contraseña tal cual en password_hash
        password: formData.password,
        estado: formData.estado,
        perfiles: [parseInt(formData.perfil)], // Enviar como array con un solo elemento
        companias: formData.companias,
        idGrupoEmpresarial: formData.idGrupoEmpresarial || null,
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
        // Redirigir a la lista de usuarios (según el perfil del usuario autenticado)
        if (perfilActivo === 'Superadministrador') {
          navigate('/layout/dashboard/usuarios-admin');
        } else {
          navigate('/layout/dashboard/usuarios');
        }
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

  const handleCancel = () => {
    if (perfilActivo === 'Superadministrador') {
      navigate('/layout/dashboard/usuarios-admin');
    } else {
      navigate('/layout/dashboard/usuarios');
    }
  };

  return (
    <div className="form-container min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">Registrar Nuevo Usuario</h1>
            <p className="text-gray-600">Complete el formulario para agregar un nuevo usuario al sistema.</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Perfil *</label>
                <div className="space-y-2 border border-gray-300 rounded-lg bg-gray-50">
                  {perfilesDisponibles.length > 0 ? (
                    perfilesDisponibles.map(perfil => (
                      <div key={perfil.id_perfil} className="flex items-center p-1">
                        <input
                          type="radio"
                          id={`perfil-${perfil.id_perfil}`}
                          name="perfil-radio"
                          value={perfil.id_perfil}
                          checked={formData.perfil === String(perfil.id_perfil)}
                          onChange={() => handlePerfilChange(perfil.id_perfil)}
                        />
                        <label htmlFor={`perfil-${perfil.id_perfil}`} className="ml-3 text-sm text-gray-700 cursor-pointer font-medium">
                          {perfil.nombre}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-3">Cargando perfiles...</p>
                  )}
                </div>
                <p className="leyenda text-sm text-gray-500 mt-1">Seleccione un perfil para el usuario.</p>
              </div>

              {perfilActivo !== 'Superadministrador' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compañías *</label>
                <div className="space-y-2 border border-gray-300 rounded-lg bg-gray-50">
                  {companiasDisponibles.length > 0 ? (
                    companiasDisponibles.map(compania => (
                      <div key={compania.id_compania} className="flex items-center p-1">
                        <input
                          type="checkbox"
                          id={`compania-${compania.id_compania}`}
                          checked={formData.companias.includes(compania.id_compania)}
                          onChange={() => handleCompaniaChange(compania.id_compania)}
                        />
                        <label htmlFor={`compania-${compania.id_compania}`} className="ml-2 text-sm text-gray-700">
                          {compania.nombre}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-3">No hay compañías disponibles</p>
                  )}
                </div>
                <p className="leyenda text-sm text-gray-500 mt-1">Seleccione al menos una compañía para el usuario.</p>
              </div>
              )}

              {perfilActivo === 'Superadministrador' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grupo Empresarial *</label>
                <select 
                  name="idGrupoEmpresarial" 
                  value={formData.idGrupoEmpresarial} 
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg">
                  <option value="">-- Seleccionar grupo empresarial --</option>
                  {gruposEmpresarialesDisponibles.map(grupo => (
                    <option key={grupo.id_grupo_empresarial} value={grupo.id_grupo_empresarial}>
                      {grupo.nombre}
                    </option>
                  ))}
                </select>
                <p className="leyenda text-sm text-gray-500 mt-1">Seleccione el grupo empresarial para el usuario Superadministrador.</p>
              </div>
              )}

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
