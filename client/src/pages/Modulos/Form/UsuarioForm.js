import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import { handleNavigationByProfile } from '../../../utils/navigationUtils';

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
    estado: 'ACTIVO'
  });

  const [perfilesDisponibles, setPerfilesDisponibles] = useState([]);
  const [companiasDisponibles, setCompaniasDisponibles] = useState([]);
  const [gruposEmpresarialesDisponibles, setGruposEmpresarialesDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Hacer scroll al inicio cuando hay un error
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

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

  // Validar formulario según el perfil del usuario
  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    
    if (!formData.username.trim()) {
      setError('El usuario (username) es obligatorio');
      return false;
    }
    
    if (!formData.password) {
      setError('La contraseña es obligatoria');
      return false;
    }

    if (!formData.perfil) {
      setError('Debe seleccionar un perfil');
      return false;
    }

    if (perfilActivo === 'Superadministrador' && !formData.idGrupoEmpresarial) {
      setError('Debe seleccionar un grupo empresarial');
      return false;
    }

    if (perfilActivo !== 'Superadministrador' && formData.companias.length === 0) {
      setError('Debe seleccionar al menos una compañía');
      return false;
    }

    if (!idUsuario) {
      setError('No se pudo obtener la información del usuario autenticado');
      return false;
    }

    return true;
  };

  // Construir payload para enviar
  const construirPayload = () => ({
    nombre: formData.nombre.trim(),
    username: formData.username.trim(),
    password: formData.password,
    estado: formData.estado,
    perfiles: [Number.parseInt(formData.perfil)],
    companias: formData.companias,
    idGrupoEmpresarial: formData.idGrupoEmpresarial || null,
    id_usuario: idUsuario
  });

  // Procesar respuesta del servidor
  const procesarRespuesta = async (response) => {
    let result;
    try {
      const responseText = await response.text();
      result = JSON.parse(responseText);
    } catch (jsonErr) {
      throw new Error(`Error del servidor (${response.status}): No se pudo parsear la respuesta`);
    }

    if (result?.success) {
      return true;
    } else if (result?.message) {
      throw new Error(result.message);
    } else {
      throw new Error('Error al crear el usuario');
    }
  };

  // Redirigir según perfil
  const handleCancel = () => {
    handleNavigationByProfile(navigate, perfilActivo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = construirPayload();

      const response = await fetch(`${API_BASE_URL}/module/usuarios.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      await procesarRespuesta(response);
      handleNavigationByProfile(navigate, perfilActivo);
    } catch (err) {
      console.error('Error creating usuario:', err);
      setError(err.message || 'No se pudo crear el usuario. Intente nuevamente.');
    } finally {
      setLoading(false);
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
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                <input id="nombre" type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Nombre completo" required />
                {formData.nombre === '' && <ValidationMessage fieldName="un Nombre" />}
                <p className="leyenda text-sm text-gray-500 mt-1">Nombre completo del usuario.</p>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Usuario (username) *</label>
                <input id="username" type="text" name="username" value={formData.username} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="usuario123" required />
                {formData.username === '' && <ValidationMessage fieldName="un Usuario (username)" />}
                <p className="leyenda text-sm text-gray-500 mt-1">Nombre de usuario único para acceder al sistema.</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                  placeholder="Contraseña" 
                  required 
                />
                <div className="flex items-center mt-2">
                  <input
                    id="showPassword"
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  <label htmlFor="showPassword" className="ml-2 text-sm text-gray-700 cursor-pointer">
                    Mostrar contraseña
                  </label>
                </div>
                {formData.password === '' && <ValidationMessage fieldName="una Contraseña" />}
                <p className="leyenda text-sm text-gray-500 mt-1">La contraseña será hasheada con bcrypt en el servidor.</p>
              </div>

              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">Perfil *</legend>
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
                          required
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
                {formData.perfil === '' && <ValidationMessage fieldName="un Perfil" />}
                <p className="leyenda text-sm text-gray-500 mt-1">Seleccione un perfil para el usuario.</p>
              </fieldset>

              {perfilActivo !== 'Superadministrador' && (
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">Compañías *</legend>
                <div className="space-y-2 border border-gray-300 rounded-lg bg-gray-50">
                  {companiasDisponibles.length > 0 ? (
                    companiasDisponibles.map(compania => (
                      <div key={compania.id_compania} className="flex items-center p-1">
                        <input
                          type="checkbox"
                          id={`compania-${compania.id_compania}`}
                          checked={formData.companias.includes(compania.id_compania)}
                          onChange={() => handleCompaniaChange(compania.id_compania)}
                          required
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
                {formData.companias.length === 0 && <ValidationMessage fieldName="al menos una Compañía" />}
                <p className="leyenda text-sm text-gray-500 mt-1">Seleccione al menos una compañía para el usuario.</p>
              </fieldset>
              )}

              {perfilActivo === 'Superadministrador' && (
              <div>
                <label htmlFor="idGrupoEmpresarial" className="block text-sm font-medium text-gray-700 mb-2">Grupo Empresarial *</label>
                <select 
                  id="idGrupoEmpresarial"
                  name="idGrupoEmpresarial" 
                  value={formData.idGrupoEmpresarial} 
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required>
                  <option value="">-- Seleccionar grupo empresarial --</option>
                  {gruposEmpresarialesDisponibles.map(grupo => (
                    <option key={grupo.id_grupo_empresarial} value={grupo.id_grupo_empresarial}>
                      {grupo.nombre}
                    </option>
                  ))}
                </select>
                {formData.idGrupoEmpresarial === '' && <ValidationMessage fieldName="un Grupo Empresarial" />}
                <p className="leyenda text-sm text-gray-500 mt-1">Seleccione el grupo empresarial para el nuevo usuario.</p>
              </div>
              )}

              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                <select id="estado" name="estado" value={formData.estado} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg">
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
                <p className="leyenda text-sm text-gray-500 mt-1">Estado actual del usuario en el sistema.</p>
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
