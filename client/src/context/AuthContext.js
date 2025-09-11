import { createContext, useContext, useState, useEffect, useCallback } from "react";
import config from "../config";

const AuthContext = createContext();

let inactivityTimer = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tipoUsuario, setTipoUsuario] = useState(null);
  const [menus, setMenus] = useState([]);  // Menús del usuario
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const { API_BASE_URL } = config;

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setTipoUsuario(null); // Limpiar tipoUsuario al hacer logout
    setMenus([]);  // Limpiar menús al hacer logout
    setToken(null);
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
      setUser(parsedData.usuario);
      setTipoUsuario(parsedData.tipo_usuario);  // Asegúrate de que 'tipo_usuario' se guarde aquí

    
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout ]); // Solo depende de `logout` y `fetchMenus`, no de `API_BASE_URL`.

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

      setUser(jsonResponse.usuario);
      setTipoUsuario(jsonResponse.tipo_usuario);  // Asegúrate de almacenar el tipo de usuario aquí
      setMenus(jsonResponse.menus);
      localStorage.setItem("userData", JSON.stringify(jsonResponse));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tipoUsuario,  // Ahora también proporcionamos tipoUsuario
        menus,
        loading,
        token,
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
