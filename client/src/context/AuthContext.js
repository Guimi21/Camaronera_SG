import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import config from "../config";

const AuthContext = createContext();

let inactivityTimer = null;

export const AuthProvider = ({ children }) => {
  const [nombre, setNombre] = useState(null); // Estado para el nombre del usuario
  const [user, setUser] = useState(null);  // Estado para el nickname del usuario
  const [perfiles, setPerfiles] = useState([]); // Estado para los perfiles del usuario
  const [perfilActivo, setPerfilActivo] = useState(null); // Estado para el perfil activo (el primero)
  const [menus, setMenus] = useState([]);  // Menús del usuario
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [grupoEmpresarial, setGrupoEmpresarial] = useState(null); // Agregamos estado para el grupo empresarial
  const [companias, setCompanias] = useState([]); // Array de todas las compañías del usuario
  const [compania, setCompania] = useState(null); // Agregamos estado para la empresa activa
  const [idCompania, setIdCompania] = useState(null); // Agregamos estado para el ID de la compañía activa
  const [idUsuario, setIdUsuario] = useState(null); // Agregamos estado para el ID del usuario
  const { API_BASE_URL } = config;

  // Logout
  const logout = useCallback(() => {
    setNombre(null); // Limpiar nombre al hacer logout
    setUser(null); // Limpiar usuario al hacer logout
    setPerfiles([]); // Limpiar perfiles al hacer logout
    setPerfilActivo(null); // Limpiar perfil activo al hacer logout
    setMenus([]);  // Limpiar menús al hacer logout
    setToken(null); // Limpiar token al hacer logout
    setGrupoEmpresarial(null); // Limpiar grupo empresarial
    setCompanias([]); // Limpiar array de compañías
    setCompania(null); // Limpiar compañía
    setIdCompania(null); // Limpiar ID compañía
    setIdUsuario(null); // Limpiar ID usuario
    localStorage.removeItem("authData");
    if (inactivityTimer) clearTimeout(inactivityTimer);
  }, []);

  const verifyToken = useCallback(async () => {
    const authData = localStorage.getItem("authData");
    if (!authData) {
      setLoading(false);
      return;
    }

    try {
      const parsedData = JSON.parse(authData);
      if (!parsedData.token) {
        logout();
        return;
      }

      setToken(parsedData.token);
      setNombre(parsedData.nombre); // Guardamos el nombre del usuario
      setUser(parsedData.usuario);  // Guardamos el nickname del usuario
      setPerfiles(parsedData.perfiles || []); // Guardamos los perfiles del usuario
      setPerfilActivo(parsedData.perfiles && parsedData.perfiles.length > 0 ? parsedData.perfiles[0].nombre : null); // Primer perfil como activo
      setGrupoEmpresarial(parsedData.grupo_empresarial); // Guardamos grupo empresarial
      setCompanias(parsedData.companias || []); // Guardamos todas las compañías
      
      // Establecer la compañía activa (desde localStorage si existe, o la primera del array)
      const companiaActivaId = localStorage.getItem('companiaActivaId');
      if (companiaActivaId && parsedData.companias) {
        const companiaEncontrada = parsedData.companias.find(c => c.id_compania === Number.parseInt(companiaActivaId));
        if (companiaEncontrada) {
          setCompania(companiaEncontrada.nombre);
          setIdCompania(companiaEncontrada.id_compania);
        } else {
          setCompania(parsedData.compania);
          setIdCompania(parsedData.id_compania);
        }
      } else {
        setCompania(parsedData.compania);
        setIdCompania(parsedData.id_compania);
      }
      
      setIdUsuario(parsedData.id_usuario); // Guardamos ID usuario
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const responseText = await response.text();
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(responseText);
      } catch (error) {
        throw new Error("La respuesta no es un JSON válido.");
      }

      if (!response.ok) {
        throw new Error(jsonResponse.error || "Credenciales incorrectas");
      }

      setNombre(jsonResponse.nombre); // Guardamos el nombre del usuario
      setUser(jsonResponse.usuario);  // Guardamos el nickname del usuario
      setPerfiles(jsonResponse.perfiles || []); // Guardamos los perfiles del usuario
      setPerfilActivo(jsonResponse.perfiles && jsonResponse.perfiles.length > 0 ? jsonResponse.perfiles[0].nombre : null); // Primer perfil como activo
      setMenus(jsonResponse.menus); // Guardamos los menús
      setGrupoEmpresarial(jsonResponse.grupo_empresarial); // Guardamos grupo empresarial
      setCompanias(jsonResponse.companias || []); // Guardamos todas las compañías
      setCompania(jsonResponse.compania); // Guardamos compañía activa
      setIdCompania(jsonResponse.id_compania); // Guardamos ID compañía activa
      setIdUsuario(jsonResponse.id_usuario); // Guardamos ID usuario
      localStorage.setItem("authData", JSON.stringify(jsonResponse));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Función para cambiar la compañía activa
  const cambiarCompania = useCallback((id_compania) => {
    const companiaSeleccionada = companias.find(c => c.id_compania === id_compania);
    if (companiaSeleccionada) {
      setCompania(companiaSeleccionada.nombre);
      setIdCompania(companiaSeleccionada.id_compania);
      localStorage.setItem('companiaActivaId', id_compania.toString());
      
      // Actualizar también en authData para mantener persistencia
      const authData = localStorage.getItem("authData");
      if (authData) {
        try {
          const parsedData = JSON.parse(authData);
          parsedData.compania = companiaSeleccionada.nombre;
          parsedData.id_compania = companiaSeleccionada.id_compania;
          localStorage.setItem("authData", JSON.stringify(parsedData));
        } catch (error) {
          console.error("Error al actualizar authData:", error);
        }
      }
    }
  }, [companias]);

  // Función para actualizar las compañías del usuario autenticado
  const actualizarCompanias = (nuevasCompanias) => {
    setCompanias(nuevasCompanias);
    
    // Si hay compañías nuevas, seleccionar la primera
    if (nuevasCompanias && nuevasCompanias.length > 0) {
      const primeraCompania = nuevasCompanias[0];
      setCompania(primeraCompania.nombre);
      setIdCompania(primeraCompania.id_compania);
      localStorage.setItem('companiaActivaId', primeraCompania.id_compania.toString());
      
      // Actualizar authData
      const authData = localStorage.getItem("authData");
      if (authData) {
        try {
          const parsedData = JSON.parse(authData);
          parsedData.companias = nuevasCompanias;
          parsedData.compania = primeraCompania.nombre;
          parsedData.id_compania = primeraCompania.id_compania;
          localStorage.setItem("authData", JSON.stringify(parsedData));
        } catch (error) {
          console.error("Error al actualizar authData:", error);
        }
      }
    }
  };

  const value = useMemo(
    () => ({
      nombre,
      user,
      perfiles,
      perfilActivo, 
      menus,
      loading,
      token,
      grupoEmpresarial,
      companias,
      compania,
      idCompania,
      idUsuario,
      login,
      logout,
      cambiarCompania,
      actualizarCompanias,
      isAuthenticated: !!user,
    }),
    [
      nombre,
      user,
      perfiles,
      perfilActivo,
      menus,
      loading,
      token,
      grupoEmpresarial,
      companias,
      compania,
      idCompania,
      idUsuario,
      login,
      logout,
      cambiarCompania,
      actualizarCompanias,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  return context;
};
