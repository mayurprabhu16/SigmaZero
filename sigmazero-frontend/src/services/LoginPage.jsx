import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, Lock, User, Building, UserPlus, LogIn } from 'lucide-react';
import { useTenant } from './TenantContext';
import api, { setApiTenantId } from './api';

export const LoginPage = ({ onLoginSuccess }) => {
  const { tenants, selectTenant, createTenant } = useTenant();
  const [mode, setMode] = useState('signin');
  const [username, setUsername] = useState('admin@acme.corp');
  const [password, setPassword] = useState('••••••••');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [tenants, selectedTenantId]);

  const handleSignIn = (e) => {
    e.preventDefault();
    setError(null);

    const chosen = tenants.find((t) => t.id === selectedTenantId) || tenants[0];
    if (!chosen) {
      setError('Please choose or create an organization first.');
      return;
    }

    selectTenant(chosen);
    onLoginSuccess({ username, tenant: chosen });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const newTenant = await createTenant(organizationName);
      selectTenant(newTenant);
      setApiTenantId(newTenant.id);

      const defaultAccounts = [
        { code: '1000', name: 'Cash & Operational Bank', type: 'ASSET', currency: 'USD' },
        { code: '1100', name: 'Accounts Receivable', type: 'ASSET', currency: 'USD' },
        { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', currency: 'USD' },
        { code: '3000', name: 'Owner Equity', type: 'EQUITY', currency: 'USD' },
        { code: '4000', name: 'Primary Revenue', type: 'REVENUE', currency: 'USD' },
        { code: '5000', name: 'Operating Expense', type: 'EXPENSE', currency: 'USD' },
      ];

      for (const acc of defaultAccounts) {
        await api.post('/accounts', acc);
      }

      onLoginSuccess({ username, tenant: newTenant });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize tenant workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <Layers size={24} />
          </div>
          <h1 className="auth-title">SigmaZero</h1>
          <p className="auth-subtitle">Zero-variance double-entry ledger platform</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(null); }}
          >
            <LogIn size={13} style={{ display: 'inline', marginRight: '6px' }} />
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); }}
          >
            <UserPlus size={13} style={{ display: 'inline', marginRight: '6px' }} />
            Sign Up
          </button>
        </div>

        {error && (
          <div className="alert-box" style={{ marginBottom: '1.25rem' }}>
            <span>{error}</span>
          </div>
        )}

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="form-group" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building size={13} /> Target Tenant Workspace
              </label>
              <select
                className="input-select"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                required
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={13} /> Operator Email
              </label>
              <input
                type="email"
                className="input-text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="operator@entity.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={13} /> Security Key
              </label>
              <input
                type="password"
                className="input-text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-auth">
              <span>Authorize Session</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="form-group" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building size={13} /> New Organization Name
              </label>
              <input
                type="text"
                className="input-text"
                required
                placeholder="e.g. Apex Global Corp"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={13} /> Admin Operator Email
              </label>
              <input
                type="email"
                className="input-text"
                required
                placeholder="founder@apexcorp.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={13} /> Password
              </label>
              <input
                type="password"
                className="input-text"
                required
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-auth" disabled={loading}>
              <span>{loading ? 'Initializing Workspace...' : 'Register & Provision Ledger'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};