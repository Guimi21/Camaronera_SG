import { createContext, useContext, useState, useEffect, useCallback } from "react";
import config from "../config";

// Crear contexto
const AuthContext = createContext();

// Tiempo de inactividad (15 minutos)
const INACTIVITY_TIME = 15 * 60 * 1000;
let inactivityTimer = null;

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const { API_BASE_URL } = config;

  // Logout
  const logout = useCallback(() => {
    console.log("Cerrando sesión");
    setUser(null);
    setPerfiles([]);
    setMenus([]);
    setToken(null);
    localStorage.removeItem("authData");
    if (inactivityTimer) clearTimeout(inactivityTimer);
  }, []);

  // Reiniciar timer de inactividad
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.log("Sesión cerrada por inactividad");
      logout();
    }, INACTIVITY_TIME);
  }, [logout]);

  // Verificar token al iniciar
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

      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${parsedData.token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.usuario);
        setPerfiles(userData.perfiles);
        setMenus(userData.menus);
        resetInactivityTimer(); // reinicia timer
      } else {
        logout();
      }
    } catch (error) {
      console.error("Error verificando token:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, logout, resetInactivityTimer]);

  // Ejecutar verifyToken al montar
  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // Escuchar actividad del usuario para reiniciar timer
  useEffect(() => {
    if (!token) return;

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));

    return () => {
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, [token, resetInactivityTimer]);

  // Login
  const login = async (username, password) => {
    try {
      console.log("Iniciando login para:", username);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Credenciales incorrectas");
      }

      const authData = await response.json();

      setUser(authData.usuario);
      setPerfiles(authData.perfiles);
      setMenus(authData.menus);
      setToken(authData.token);

      localStorage.setItem("authData", JSON.stringify(authData));

      resetInactivityTimer(); // iniciar timer al login

      return { success: true };
    } catch (error) {
      console.error("Error en login:", error);
      return { success: false, error: error.message || "Error al conectar con el servidor" };
    }
  };

  // Fetch autenticado
  const authFetch = async (url, options = {}) => {
    if (!token) throw new Error("No hay token de autenticación");

    const configFetch = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${url}`, configFetch);

    if (response.status === 401) {
      logout();
      throw new Error("Sesión expirada");
    }

    // Renovar timer al hacer peticiones
    resetInactivityTimer();

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        perfiles,
        menus,
        loading,
        token,
        login,
        logout,
        authFetch,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  return context;
};

export default AuthContext;
