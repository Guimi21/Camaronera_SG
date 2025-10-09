const config = {
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? "https://camaron360.com/server" 
    : "http://localhost:5000"
};

export default config;



