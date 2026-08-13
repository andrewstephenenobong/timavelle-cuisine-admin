import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://timavelle-cuisine-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
