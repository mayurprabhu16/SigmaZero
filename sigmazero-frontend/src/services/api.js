import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

export const getStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem('sigmazero_session') || 'null');
  } catch {
    return null;
  }
};

export const setApiToken = (token) => {
  if (token) localStorage.setItem('sigmazero_token', token);
  else localStorage.removeItem('sigmazero_token');
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sigmazero_token') || getStoredSession()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('sigmazero_session');
      localStorage.removeItem('sigmazero_token');
      window.dispatchEvent(new Event('sigmazero:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
