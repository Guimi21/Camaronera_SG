import { createContext, useContext, useState, useEffect, useCallback } from "react";
import config from "../config";

const AuthContext = createContext();

// Tiempo de inactividad (15 minutos)
const INACTIVITY_TIME = 15 * 60 * 1000;
let inactivityTimer = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tipoUsuario, setTipoUsuario] = useState(null);
  const [menus, setMenus] = useState([]);  // Nuevo estado para los menús
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const { API_BASE_URL } = config;

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setTipoUsuario(null);
    setMenus([]);  // Limpiar menús al hacer logout
    setToken(null);
    localStorage.removeItem("authData");
    if (inactivityTimer) clearTimeout(inactivityTimer);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      logout();
    }, INACTIVITY_TIME);
  }, [logout]);

  // Función para obtener los menús según el perfil del usuario
  const fetchMenus = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/get_menus.php?userId=${userId}`);
      const data = await response.json();
      if (response.ok) {
        setMenus(data);  // Guardar los menús en el estado
      } else {
        console.error("Error al obtener los menús", data);
      }
    } catch (error) {
      console.error("Error al obtener los menús:", error);
    }
  };

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

      // Obtener los menús según el perfil del usuario
      await fetchMenus(parsedData.usuario.id_usuario);  // Obtener menús con el ID de usuario
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, logout]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  useEffect(() => {
    if (!token) return;

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, [token, resetInactivityTimer]);

  const login = async (username, password) => {
    try {
      // Imprimir los datos que se están enviando al backend
      console.log("Enviando datos al backend:", { username, password });

      const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",  // Asegúrate de que el backend reciba JSON
        },
        body: JSON.stringify({ username, password }),  // Enviamos los datos como JSON
      });

      // Imprimir la respuesta como texto para depuración
      const responseText = await response.text();  // Obtener la respuesta como texto primero
      console.log("Respuesta del backend (texto):", responseText);  // Ver la respuesta completa en consola

      // Verificar si la respuesta no es un JSON válido
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(responseText);  // Intentamos convertir la respuesta en JSON
        console.log("Respuesta del backend (JSON):", jsonResponse);  // Ver el JSON parseado
      } catch (error) {
        // Si ocurre un error al parsear JSON, mostrar más detalles
        console.error("Error al parsear JSON:", error);
        console.error("Contenido de la respuesta que no es un JSON válido:", responseText);
        throw new Error("La respuesta no es un JSON válido.");
      }

      if (!response.ok) {
        // Si la respuesta no es OK (error en el backend), lanzar el error adecuado
        throw new Error(jsonResponse.error || "Credenciales incorrectas");
      }

      // Si la respuesta es válida, continúa con la autenticación
      setUser(jsonResponse.usuario);
      setTipoUsuario(jsonResponse.tipo_usuario);

      // Guardar los datos del usuario en localStorage si quieres persistir la sesión
      localStorage.setItem("userData", JSON.stringify(jsonResponse));

      return { success: true };
    } catch (error) {
      console.error("Error en el login:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tipoUsuario,
        menus,  // Agregar los menús al contexto
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
