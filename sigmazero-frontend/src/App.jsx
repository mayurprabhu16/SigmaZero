import React, { useEffect, useState } from 'react';
import { TenantProvider, useTenant } from './services/TenantContext';
import { BalancedJournalForm } from './services/BalancedJournalForm';
import { TrialBalanceTable } from './services/TrialBalanceTable';
import { JournalHistory } from './services/JournalHistory';
import { LoginPage } from './services/LoginPage';
import { Layers, LogOut, ShieldCheck, Building2 } from 'lucide-react';
import { setApiToken } from './services/api';
import './index.css';

function Dashboard({ user, onLogout }) {
  const { activeTenant } = useTenant();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEntryPosted = () => setRefreshKey((k) => k + 1);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-container">
          <div className="brand-section">
            <div className="brand-icon"><Layers size={22} /></div>
            <div>
              <div className="brand-title">SigmaZero <span className="brand-badge">Double-Entry</span></div>
              <div className="brand-sub">Append-only immutable ledger</div>
            </div>
          </div>

          <div className="header-right">
            <div className="workspace-pill"><Building2 size={14} /><span>{activeTenant?.name || 'Workspace'}</span></div>
            <div className="user-profile-section">
              <div className="user-meta"><span className="user-tag">{user.user?.email || user.email}</span><span className="role-tag"><ShieldCheck size={11} /> {user.user?.role || 'ADMIN'}</span></div>
              <button className="btn-logout" onClick={onLogout} title="Sign Out"><LogOut size={14} /><span>Sign out</span></button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="page-intro">
          <div><span className="eyebrow">ACCOUNTING CONTROL CENTER</span><h1>Ledger workspace</h1><p>Post balanced transactions, review the complete journal, and verify account positions.</p></div>
          <div className="secure-chip"><ShieldCheck size={14} /> JWT protected</div>
        </section>
        <BalancedJournalForm onEntryPosted={handleEntryPosted} />
        <JournalHistory refreshTrigger={refreshKey} />
        <TrialBalanceTable refreshTrigger={refreshKey} />
      </main>
    </div>
  );
}

function MainApp() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sigmazero_session') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    const logout = () => setSession(null);
    window.addEventListener('sigmazero:logout', logout);
    return () => window.removeEventListener('sigmazero:logout', logout);
  }, []);

  const handleLoginSuccess = (data) => {
    setSession(data);
    localStorage.setItem('sigmazero_session', JSON.stringify(data));
    setApiToken(data.token);
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('sigmazero_session');
    setApiToken(null);
  };

  if (!session?.token) return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  return <Dashboard user={session} onLogout={handleLogout} />;
}

export default function App() {
  return <TenantProvider><MainApp /></TenantProvider>;
}
