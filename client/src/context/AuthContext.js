import { createContext, useContext, useState, useEffect, useCallback } from "react";
import config from "../config";

const AuthContext = createContext();

let inactivityTimer = null;

export const AuthProvider = ({ children }) => {
  const [nombre, setNombre] = useState(null); // Estado para el nombre del usuario
  const [user, setUser] = useState(null);  // Estado para el nickname del usuario
  const [tipoUsuario, setTipoUsuario] = useState(null); // Estado para el tipo de usuario
  const [menus, setMenus] = useState([]);  // Menús del usuario
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [grupoEmpresarial, setGrupoEmpresarial] = useState(null); // Agregamos estado para el grupo empresarial
  const [compania, setCompania] = useState(null); // Agregamos estado para la empresa
  const [idCompania, setIdCompania] = useState(null); // Agregamos estado para el ID de la compañía
  const [idUsuario, setIdUsuario] = useState(null); // Agregamos estado para el ID del usuario
  const { API_BASE_URL } = config;

  // Logout
  const logout = useCallback(() => {
    setNombre(null); // Limpiar nombre al hacer logout
    setUser(null); // Limpiar usuario al hacer logout
    setTipoUsuario(null); // Limpiar tipoUsuario al hacer logout
    setMenus([]);  // Limpiar menús al hacer logout
    setToken(null); // Limpiar token al hacer logout
    setGrupoEmpresarial(null); // Limpiar grupo empresarial
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
      setTipoUsuario(parsedData.tipo_usuario);  // Asegúrate de que 'tipo_usuario' se guarde aquí
      setGrupoEmpresarial(parsedData.grupo_empresarial); // Guardamos grupo empresarial
      setCompania(parsedData.compania); // Guardamos compañía
      setIdCompania(parsedData.id_compania); // Guardamos ID compañía
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
      setTipoUsuario(jsonResponse.tipo_usuario);  // Asegúrate de almacenar el tipo de usuario aquí
      setMenus(jsonResponse.menus); // Guardamos los menús
      setGrupoEmpresarial(jsonResponse.grupo_empresarial); // Guardamos grupo empresarial
      setCompania(jsonResponse.compania); // Guardamos compañía
      setIdCompania(jsonResponse.id_compania); // Guardamos ID compañía
      setIdUsuario(jsonResponse.id_usuario); // Guardamos ID usuario
      localStorage.setItem("authData", JSON.stringify(jsonResponse));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        nombre,
        user,
        tipoUsuario, 
        menus,
        loading,
        token,
        grupoEmpresarial, 
        compania,
        idCompania, // Agregamos idCompania al context
        idUsuario, // Agregamos idUsuario al context
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  return context;
};
