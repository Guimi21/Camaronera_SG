import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import { handleNavigationByProfile } from '../../../utils/navigationUtils';
import { usePerfiles, useUserData, useCompanias, useGruposEmpresariales } from '../../../utils/usuarioFormHooks';
import { 
  validarFormulario, 
  construirPayload,
  extraerPerfilesIds,
  extraerCompaniasIds,
  extraerGrupoEmpresarialId
} from '../../../utils/usuarioFormHelpers';

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
  const { idUsuario: idUsuarioParam } = useParams();
  const { API_BASE_URL } = config;
  const { idUsuario: idUsuarioAuth, perfilActivo, actualizarCompanias } = useAuth();

  // Determinar si es modo edición
  const isEditMode = !!idUsuarioParam;

  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    password: '',
    perfil: '', // ID del perfil seleccionado (solo uno)
    companias: [], // Array de IDs de compañías seleccionadas
    idGrupoEmpresarial: '', // ID del grupo empresarial (solo para Superadministrador)
    estado: 'ACTIVO'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Usar hooks personalizados
  const perfilesDisponibles = usePerfiles(API_BASE_URL);
  const companiasDisponibles = useCompanias(idUsuarioAuth, API_BASE_URL);
  const gruposEmpresarialesDisponibles = useGruposEmpresariales(perfilActivo, API_BASE_URL);
  const userDataResult = useUserData({
    idUsuarioParam,
    idUsuarioAuth,
    isEditMode,
    perfilesDisponibles,
    perfilActivo,
    API_BASE_URL
  });

  const { usuario, loading: userLoading, error: userError } = userDataResult;

  // Cargar datos del usuario en formData cuando sea necesario
  useEffect(() => {
    if (usuario && isEditMode && !loading) {
      const perfilesIds = usuario.perfiles 
        ? extraerPerfilesIds(usuario.perfiles, perfilesDisponibles)
        : [];
      const companiasIds = usuario.companias 
        ? extraerCompaniasIds(usuario.companias, companiasDisponibles)
        : [];
      const idGrupoEmpresarial = usuario.grupo_empresarial
        ? extraerGrupoEmpresarialId(usuario.grupo_empresarial, gruposEmpresarialesDisponibles)
        : '';

      const primerPerfil = perfilesIds.length > 0 ? perfilesIds[0] : '';

      setFormData({
        nombre: usuario.nombre || '',
        username: usuario.username || '',
        password: '',
        perfil: String(primerPerfil),
        companias: companiasIds,
        idGrupoEmpresarial: idGrupoEmpresarial,
        estado: usuario.estado || 'ACTIVO'
      });
    }
  }, [usuario, isEditMode]);

  // Hacer scroll al inicio cuando hay un error
  useEffect(() => {
    if (error || userError) {
      setError(userError || error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error, userError]);

  // Actualizar loading si hay cambio en userLoading
  useEffect(() => {
    setLoading(userLoading);
  }, [userLoading]);

  const handlePerfilChange = (id_perfil) => {
    setFormData(prev => ({
      ...prev,
      perfil: String(id_perfil)
    }));
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
  const validar = () => {
    const result = validarFormulario(formData, isEditMode, perfilActivo, idUsuarioAuth);
    if (!result.valid) {
      setError(result.error);
      return false;
    }
    return true;
  };

  // Construir payload para enviar
  const construir = () => construirPayload(formData, isEditMode, idUsuarioParam, idUsuarioAuth, perfilActivo);

  // Actualizar contexto si el usuario se edita a sí mismo
  const actualizarContextoSiNecesario = async () => {
    if (!isEditMode || Number.parseInt(idUsuarioParam) !== Number.parseInt(idUsuarioAuth)) {
      return;
    }

    try {
      const usuarioResponse = await fetch(
        `${API_BASE_URL}/module/usuarios.php?id_usuario=${idUsuarioAuth}`,
        { method: 'GET', credentials: 'include' }
      );

      if (!usuarioResponse.ok) return;

      const usuarioResult = await usuarioResponse.json();
      if (!usuarioResult.success || !usuarioResult.data) return;

      const usuarioActualizado = usuarioResult.data.find(u => Number.parseInt(u.id_usuario) === Number.parseInt(idUsuarioAuth));
      if (!usuarioActualizado) return;

      const companiasDispResponse = await fetch(
        `${API_BASE_URL}/module/companias.php?id_usuario=${idUsuarioAuth}`,
        { method: 'GET', credentials: 'include' }
      );

      if (!companiasDispResponse.ok) return;

      const companiasDispResult = await companiasDispResponse.json();
      if (companiasDispResult.success && companiasDispResult.data) {
        const companiasNombres = usuarioActualizado.companias 
          ? usuarioActualizado.companias.split(', ').map(n => n.trim()) 
          : [];
        
        const companiasActualizadas = companiasNombres
          .map(nombre => companiasDispResult.data.find(c => c.nombre === nombre))
          .filter(c => c !== undefined);
        
        actualizarCompanias(companiasActualizadas);
      }
    } catch (err) {
      console.error('Error fetching updated user data:', err);
    }
  };

  // Redirigir según perfil
  const getButtonText = () => {
    if (loading) return 'Guardando...';
    return isEditMode ? 'Guardar Cambios' : 'Guardar Usuario';
  };

  const handleCancel = () => {
    handleNavigationByProfile(navigate, perfilActivo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validar()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = construir();
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(`${API_BASE_URL}/module/usuarios.php`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        await actualizarContextoSiNecesario();
        handleNavigationByProfile(navigate, perfilActivo);
      } else {
        throw new Error(result.message || (isEditMode ? 'Error al actualizar el usuario' : 'Error al crear el usuario'));
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || (isEditMode ? 'No se pudo actualizar el usuario. Intente nuevamente.' : 'No se pudo crear el usuario. Intente nuevamente.'));
    } finally {
      setLoading(false);
    }
  };

  if (isEditMode && loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Cargando...</span>
      </div>
    );
  }

  if (isEditMode && !usuario) {
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
            <h1 className="text-2xl font-bold text-blue-800 mb-2">
              {isEditMode ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
            </h1>
            <p className="text-gray-600">
              {isEditMode 
                ? `Modifique los datos del usuario: ${usuario?.username}`
                : 'Complete el formulario para agregar un nuevo usuario al sistema.'
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                <input id="nombre" type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Nombre completo" required />
                {formData.nombre === '' && <ValidationMessage fieldName="un Nombre" />}
                <p className="leyenda text-sm text-gray-500 mt-1">Nombre completo del usuario.</p>
              </div>

              {!isEditMode && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Usuario (username) *</label>
                <input id="username" type="text" name="username" value={formData.username} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="usuario123" required />
                {formData.username === '' && <ValidationMessage fieldName="un Usuario (username)" />}
                <p className="leyenda text-sm text-gray-500 mt-1">Nombre de usuario único para acceder al sistema.</p>
              </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña {isEditMode ? '(opcional para cambiar)' : '*'}
                </label>
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                  placeholder={isEditMode ? "Dejar vacío para mantener la actual" : "Contraseña"} 
                  required={!isEditMode}
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
                {!isEditMode && formData.password === '' && <ValidationMessage fieldName="una Contraseña" />}
                <p className="leyenda text-sm text-gray-500 mt-1">
                  {isEditMode 
                    ? 'Deje vacío para mantener la contraseña actual. La nueva contraseña será hasheada con bcrypt.'
                    : 'La contraseña será hasheada con bcrypt en el servidor.'
                  }
                </p>
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
                <p className="leyenda text-sm text-gray-500 mt-1">{isEditMode ? 'Edite el grupo empresarial del usuario.' : 'Seleccione el grupo empresarial para el nuevo usuario.'}</p>
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
                {getButtonText()}
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
