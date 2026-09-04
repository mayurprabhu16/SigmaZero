import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setApiTenantId } from './api';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenants, setTenants] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants');
      setTenants(res.data);
      if (res.data.length > 0 && !activeTenant) {
        selectTenant(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectTenant = (tenant) => {
    setActiveTenant(tenant);
    setApiTenantId(tenant.id);
  };

  const createTenant = async (name) => {
    const res = await api.post('/tenants', { name });
    setTenants((prev) => [...prev, res.data]);
    selectTenant(res.data);
    return res.data;
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return (
    <TenantContext.Provider value={{ tenants, activeTenant, selectTenant, createTenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);