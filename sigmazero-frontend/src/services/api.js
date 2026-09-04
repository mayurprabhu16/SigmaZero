import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let currentTenantId = null;

export const setApiTenantId = (tenantId) => {
  currentTenantId = tenantId;
};

api.interceptors.request.use((config) => {
  if (currentTenantId) {
    config.headers['X-Tenant-ID'] = currentTenantId;
  }
  return config;
});

export default api;