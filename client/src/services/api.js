import config from "../config";

// Servicio para manejar las solicitudes relacionadas con el usuario
export const userService = {
  getProfile: async (authFetch, userId) => {
    // Hacer una solicitud GET al backend para obtener el perfil del usuario
    const response = await authFetch(`${config.API_BASE_URL}/profile.php?id=${userId}`);
    if (!response.ok) throw new Error('Error obteniendo perfil');
    return response.json(); // Devolver el perfil del usuario
  },
};

// Servicio para manejar las solicitudes relacionadas con las piscinas
export const piscinaService = {
  // Obtener todas las piscinas
  getAllPiscinas: async (authFetch) => {
    const response = await authFetch(`${config.API_BASE_URL}/piscinas`);
    if (!response.ok) throw new Error('Error obteniendo piscinas');
    return response.json();  // Devolver todas las piscinas
  },

  // Crear una nueva piscina
  createPiscina: async (authFetch, data) => {
    const response = await authFetch(`${config.API_BASE_URL}/piscinas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),  // Enviar los datos de la piscina
    });
    if (!response.ok) throw new Error('Error creando piscina');
    return response.json();  // Devolver la respuesta de la creación
  }
};

// Función para hacer solicitudes autenticadas
export const authFetch = async (url, options = {}) => {
  // Obtener el token de autenticación del localStorage
  const authData = JSON.parse(localStorage.getItem("authData"));
  const token = authData?.token;

  if (!token) throw new Error("No hay token de autenticación");

  // Configuración de la solicitud
  const configFetch = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,  // Incluir el token JWT en el encabezado
      ...options.headers,  // Permite agregar otros encabezados si es necesario
    },
  };

  // Hacer la solicitud
  const response = await fetch(`${config.API_BASE_URL}${url}`, configFetch);

  // Si la respuesta es 401 (sesión expirada), se vuelve a hacer logout
  if (response.status === 401) {
    localStorage.removeItem("authData");
    throw new Error("Sesión expirada");
  }

  return response;  // Devolver la respuesta
};
