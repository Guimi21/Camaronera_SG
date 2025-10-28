import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';

export default function UsuarioEditForm() {
  const navigate = useNavigate();
  const { idUsuario: idUsuarioParam } = useParams();
  const { idUsuario: idUsuarioAuth, perfilActivo, actualizarCompanias } = useAuth();
  const { API_BASE_URL } = config;

  const [usuario, setUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    perfil: '', // ID del perfil seleccionado (solo uno)
    companias: [],
    estado: 'A'
  });

  const [perfilesDisponibles, setPerfilesDisponibles] = useState([]);
  const [companiasDisponibles, setCompaniasDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar datos del usuario a editar
  useEffect(() => {
    if (idUsuarioParam && idUsuarioAuth) {
      fetchPerfiles();
      fetchCompanias();
      fetchUserData();
    }
  }, [idUsuarioParam, idUsuarioAuth]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/module/usuarios.php?id_usuario=${idUsuarioAuth}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Buscar el usuario específico en la lista
        const usuarioEncontrado = result.data.find(u => 
          String(u.id_usuario) === String(idUsuarioParam)
        );
        
        if (usuarioEncontrado) {
          setUsuario(usuarioEncontrado);
        } else {
          throw new Error('Usuario no encontrado en la lista');
        }
      } else {
        throw new Error('Error al obtener usuarios');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'No se pudo cargar el usuario');
    } finally {
      setLoading(false);
    }
  };

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
        const perfilesFiltered = result.data.filter(perfil => perfil.nombre !== 'Superadministrador');
        setPerfilesDisponibles(perfilesFiltered);
      }
    } catch (err) {
      console.error('Error fetching perfiles:', err);
    }
  };

  const fetchCompanias = async () => {
    try {
      if (!idUsuarioAuth) return;

      const response = await fetch(`${API_BASE_URL}/module/companias.php?id_usuario=${idUsuarioAuth}`, {
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

  // Actualizar formData cuando el usuario y los datos estén listos
  useEffect(() => {
    if (usuario && perfilesDisponibles.length > 0) {
      const perfilesIds = usuario.perfiles ? usuario.perfiles.split(', ').map(p => {
        const perfil = perfilesDisponibles.find(pf => pf.nombre === p.trim());
        return perfil ? perfil.id_perfil : null;
      }).filter(p => p !== null) : [];

      const companiasIds = usuario.companias ? usuario.companias.split(', ').map(c => {
        const compania = companiasDisponibles.find(co => co.nombre === c.trim());
        return compania ? compania.id_compania : null;
      }).filter(c => c !== null) : [];

      // Tomar solo el primer perfil (si existe)
      const primerPerfil = perfilesIds.length > 0 ? perfilesIds[0] : '';

      setFormData({
        nombre: usuario.nombre || '',
        perfil: String(primerPerfil),
        companias: companiasIds,
        estado: usuario.estado || 'A'
      });
    }
  }, [usuario, perfilesDisponibles, companiasDisponibles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMessage('');
  };

  const handlePerfilChange = (id_perfil) => {
    setFormData(prev => ({
      ...prev,
      perfil: String(id_perfil)
    }));
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

    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!formData.perfil) {
      setError('Debe seleccionar un perfil');
      return;
    }

    // Solo validar compañías si hay compañías disponibles
    if (companiasDisponibles.length > 0 && formData.companias.length === 0) {
      setError('Debe seleccionar al menos una compañía');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        perfiles: [parseInt(formData.perfil)], // Enviar como array con un solo elemento
        companias: formData.companias,
        estado: formData.estado,
        id_usuario_edit: parseInt(idUsuarioParam),
        id_usuario: idUsuarioAuth
      };

      const response = await fetch(`${API_BASE_URL}/module/usuarios.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Si el usuario editado es a sí mismo, actualizar las compañías en el contexto
        if (parseInt(idUsuarioParam) === parseInt(idUsuarioAuth)) {
          try {
            // Fetch para obtener los datos actualizados del usuario (incluyendo compañías)
            const usuarioResponse = await fetch(
              `${API_BASE_URL}/module/usuarios.php?id_usuario=${idUsuarioAuth}`,
              {
                method: 'GET',
                credentials: 'include',
              }
            );

            if (usuarioResponse.ok) {
              const usuarioResult = await usuarioResponse.json();
              if (usuarioResult.success && usuarioResult.data) {
                // Encontrar el usuario actual en la lista
                const usuarioActualizado = usuarioResult.data.find(u => parseInt(u.id_usuario) === parseInt(idUsuarioAuth));
                
                if (usuarioActualizado) {
                  // Obtener todas las compañías disponibles para mapear nombres a objetos
                  const companiasDispResponse = await fetch(
                    `${API_BASE_URL}/module/companias.php?id_usuario=${idUsuarioAuth}`,
                    {
                      method: 'GET',
                      credentials: 'include',
                    }
                  );
                  
                  if (companiasDispResponse.ok) {
                    const companiasDispResult = await companiasDispResponse.json();
                    if (companiasDispResult.success && companiasDispResult.data) {
                      // Parseamos las compañías del usuario (están como string "nombre1, nombre2")
                      const companiasNombres = usuarioActualizado.companias 
                        ? usuarioActualizado.companias.split(', ').map(n => n.trim()) 
                        : [];
                      
                      // Mapear nombres a objetos de compañías
                      const companiasActualizadas = companiasNombres.map(nombre => {
                        return companiasDispResult.data.find(c => c.nombre === nombre);
                      }).filter(c => c !== undefined);
                      
                      actualizarCompanias(companiasActualizadas);
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error fetching updated user data:', err);
          }
        }
        
        // Esperar un poco para que el contexto se actualice antes de redirigir
        setTimeout(() => {
          // Redirigir según el perfil del usuario autenticado
          if (perfilActivo === 'Superadministrador') {
            navigate('/layout/dashboard/usuarios-admin');
          } else {
            navigate('/layout/dashboard/usuarios');
          }
        }, 100);
      } else {
        throw new Error(result.message || 'Error al actualizar el usuario');
      }

    } catch (err) {
      console.error('Error updating usuario:', err);
      setError(err.message || 'No se pudo actualizar el usuario. Intente nuevamente.');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Cargando...</span>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-red-700">Usuario no encontrado</div>
      </div>
    );
  }

  return (
    <div className="form-container min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">Editar Usuario</h1>
            <p className="text-gray-600">Modifique los datos del usuario: {usuario.username}</p>
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
                    <p className="text-sm text-gray-500 p-2">Cargando perfiles...</p>
                  )}
                </div>
                <p className="leyenda text-sm text-gray-500 mt-1">Seleccione un perfil para el usuario.</p>
              </div>

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
                    <p className="text-sm text-gray-500 p-2">No hay compañías disponibles</p>
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
                {loading ? 'Guardando...' : 'Guardar Cambios'}
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
