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
  if (token) {
    localStorage.setItem('sigmazero_token', token);
  } else {
    localStorage.removeItem('sigmazero_token');
  }
};

api.interceptors.request.use(
  (config) => {
    const session = getStoredSession();
    const token = localStorage.getItem('sigmazero_token') || session?.token;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    if ((status === 401 || status === 403) && !url.includes('/auth/')) {
      localStorage.removeItem('sigmazero_session');
      localStorage.removeItem('sigmazero_token');
      window.dispatchEvent(new Event('sigmazero:logout'));
    }

    return Promise.reject(error);
  }
);

export default api;
