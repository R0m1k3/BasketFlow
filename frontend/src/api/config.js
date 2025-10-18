import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer automatiquement les tokens invalides
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si on reçoit une erreur 401 ou 403, c'est que le token est invalide
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log('Token invalide détecté, nettoyage automatique...');
      localStorage.removeItem('token');
      
      // Si on n'est pas déjà sur la page de login, rediriger
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
