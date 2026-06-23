import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const extractEmission = (message) => api.post('/ai/extract', { message });
export const calculateEmission = (data) => api.post('/emissions/calculate', data);
export const getSummary = () => api.get('/emissions/summary');
export const getLogs = () => api.get('/emissions/logs');
export const getRecommendations = () => api.get('/ai/recommendations');

export default api;
