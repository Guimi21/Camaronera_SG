import config from "../config";

// Servicio para Usuarios
export const userService = {
  getProfile: async (authFetch) => {
    const response = await authFetch('/user/profile');
    if (!response.ok) throw new Error('Error obteniendo perfil');
    return response.json();
  },

  
};
export const piscinaService = {
  getAllPiscinas: async (authFetch) => {
    const response = await authFetch(`${config.API_BASE_URL}/piscina`);
    if (!response.ok) throw new Error('Error obteniendo piscinas');
    return response.json();
  },

  createPiscina: async (authFetch, data) => {
    const response = await authFetch(`${config.API_BASE_URL}/piscina/createPiscina`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error creando piscina');
    return response.json();
  }
};




