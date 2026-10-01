import React, { createContext, useContext, useMemo, useState } from 'react';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const [activeTenant, setActiveTenant] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sigmazero_session') || 'null')?.tenant || null;
    } catch {
      return null;
    }
  });

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
