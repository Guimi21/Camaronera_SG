import { useEffect, useState } from 'react';
import { fetchApi } from '../services/api';

// Hook para cargar perfiles disponibles
export const usePerfiles = (API_BASE_URL) => {
  const [perfilesDisponibles, setPerfilesDisponibles] = useState([]);

  useEffect(() => {
    const fetchPerfiles = async () => {
      try {
        const data = await fetchApi(
          `${API_BASE_URL}/module/perfiles.php`,
          "Error al obtener perfiles"
        );
        // Filtrar para excluir el perfil "Superadministrador"
        const perfilesFiltered = data.filter(perfil => perfil.nombre !== 'Superadministrador');
        setPerfilesDisponibles(perfilesFiltered);
      } catch (err) {
        console.error('Error fetching perfiles:', err);
      }
    };

    fetchPerfiles();
  }, [API_BASE_URL]);

  return perfilesDisponibles;
};

// Hook para cargar datos del usuario
export const useUserData = ({
  idUsuarioParam,
  idUsuarioAuth,
  isEditMode,
  perfilesDisponibles,
  perfilActivo,
  API_BASE_URL
}) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode && idUsuarioParam && idUsuarioAuth && perfilesDisponibles.length > 0) {
      fetchUserData();
    }
  }, [idUsuarioParam, idUsuarioAuth, isEditMode, perfilesDisponibles, perfilActivo]);

  const fetchUserData = async () => {
    try {
      let data;
      
      // Para Superadministrador, obtener TODOS los usuarios
      // Para otros usuarios, obtener solo los usuarios de su compañía
      if (perfilActivo === 'Superadministrador') {
        data = await fetchApi(
          `${API_BASE_URL}/module/usuarios_admin.php?id_usuario=${idUsuarioAuth}`,
          "Error al obtener usuarios administradores"
        );
      } else {
        data = await fetchApi(
          `${API_BASE_URL}/module/usuarios.php?id_usuario=${idUsuarioAuth}`,
          "Error al obtener usuarios"
        );
      }
      
      // Buscar el usuario específico en la lista
      const usuarioEncontrado = data.find(u => 
        String(u.id_usuario) === String(idUsuarioParam)
      );
      
      if (usuarioEncontrado) {
        setUsuario(usuarioEncontrado);
      } else {
        throw new Error('Usuario no encontrado en la lista');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'No se pudo cargar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return { usuario, loading, error };
};

// Hook para cargar compañías
export const useCompanias = (idUsuarioAuth, API_BASE_URL) => {
  const [companiasDisponibles, setCompaniasDisponibles] = useState([]);

  useEffect(() => {
    const fetchCompanias = async () => {
      try {
        if (!idUsuarioAuth) return;

        const data = await fetchApi(
          `${API_BASE_URL}/module/companias.php?id_usuario=${idUsuarioAuth}`,
          "Error al obtener compañías"
        );
        setCompaniasDisponibles(data);
      } catch (err) {
        console.error('Error fetching companias:', err);
      }
    };

    fetchCompanias();
  }, [idUsuarioAuth, API_BASE_URL]);

  return companiasDisponibles;
};

// Hook para cargar grupos empresariales
export const useGruposEmpresariales = (perfilActivo, API_BASE_URL) => {
  const [gruposEmpresarialesDisponibles, setGruposEmpresarialesDisponibles] = useState([]);

  useEffect(() => {
    if (perfilActivo === 'Superadministrador') {
      const fetchGruposEmpresariales = async () => {
        try {
          const data = await fetchApi(
            `${API_BASE_URL}/module/grupos_empresariales.php`,
            "Error al obtener grupos empresariales"
          );
          setGruposEmpresarialesDisponibles(data);
        } catch (err) {
          console.error('Error fetching grupos empresariales:', err);
        }
      };

      fetchGruposEmpresariales();
    }
  }, [perfilActivo, API_BASE_URL]);

  return gruposEmpresarialesDisponibles;
};
