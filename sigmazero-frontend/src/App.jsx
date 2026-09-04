import React, { useState } from 'react';
import { TenantProvider, useTenant } from './services/TenantContext';
import { BalancedJournalForm } from './services/BalancedJournalForm';
import { TrialBalanceTable } from './services/TrialBalanceTable';
import { LoginPage } from './services/LoginPage';
import { Layers, LogOut } from 'lucide-react';
import './index.css';

function Dashboard({ user, onLogout }) {
  const { tenants, activeTenant, selectTenant, loading } = useTenant();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEntryPosted = () => {
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        Loading Ledger Engine...
      </div>
    );
  }

  return (
    <div>
      <header className="app-header">
        <div className="header-container">
          <div className="brand-section">
            <div className="brand-icon">
              <Layers size={22} />
            </div>
            <div>
              <div className="brand-title">
                SigmaZero
                <span className="brand-badge">Double-Entry</span>
              </div>
              <div className="brand-sub">Append-Only Immutable Ledger</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="tenant-selector">
              <label htmlFor="tenantSelect">Workspace:</label>
              <select
                id="tenantSelect"
                className="tenant-select"
                value={activeTenant?.id || ''}
                onChange={(e) => {
                  const selected = tenants.find((t) => t.id === e.target.value);
                  if (selected) selectTenant(selected);
                }}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="user-profile-section">
              <span className="user-tag">{user.username}</span>
              <button className="btn-logout" onClick={onLogout} title="Sign Out">
                <LogOut size={14} />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <BalancedJournalForm onEntryPosted={handleEntryPosted} />
        <TrialBalanceTable refreshTrigger={refreshKey} />
      </main>
    </div>
  );
}

function MainApp() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('sigmazero_session');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (userData) => {
    setSession(userData);
    localStorage.setItem('sigmazero_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('sigmazero_session');
  };

  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard user={session} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <TenantProvider>
      <MainApp />
    </TenantProvider>
  );
}