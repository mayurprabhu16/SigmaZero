import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const TenantContext = createContext(null);

const readTenant = () => {
  try {
    return JSON.parse(localStorage.getItem('sigmazero_session') || 'null')?.tenant || null;
  } catch {
    return null;
  }
};

export const TenantProvider = ({ children }) => {
  const [activeTenant, setActiveTenant] = useState(readTenant);

  useEffect(() => {
    const syncTenant = () => setActiveTenant(readTenant());

    window.addEventListener('sigmazero:session', syncTenant);
    window.addEventListener('sigmazero:logout', syncTenant);
    window.addEventListener('storage', syncTenant);

    return () => {
      window.removeEventListener('sigmazero:session', syncTenant);
      window.removeEventListener('sigmazero:logout', syncTenant);
      window.removeEventListener('storage', syncTenant);
    };
  }, []);

  const selectTenant = (tenant) => setActiveTenant(tenant);

  const value = useMemo(() => ({
    tenants: activeTenant ? [activeTenant] : [],
    activeTenant,
    selectTenant,
    loading: false,
  }), [activeTenant]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => useContext(TenantContext);
