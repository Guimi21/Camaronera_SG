const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // En producción, usar el mismo dominio que accedió el usuario (con o sin www)
    const protocol = window.location.protocol; // https:
    const hostname = window.location.hostname; // camaron360.com o www.camaron360.com
    return `${protocol}//${hostname}/server`;
  }
  return "http://localhost:5000";
};

const config = {
  API_BASE_URL: getApiBaseUrl()
};

export default config;



