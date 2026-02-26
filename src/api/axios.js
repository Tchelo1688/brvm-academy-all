import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur requete — ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('brvm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur reponse — gerer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('brvm_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
