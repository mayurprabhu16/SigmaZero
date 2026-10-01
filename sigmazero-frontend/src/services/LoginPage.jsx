import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, User, Building2, UserPlus, LogIn, ShieldCheck } from 'lucide-react';
import api, { setApiToken } from './api';

const defaultForm = { email: '', password: '', organizationName: '' };

export const LoginPage = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === 'signin' ? '/auth/login' : '/auth/register';
      const payload = mode === 'signin'
        ? { email: form.email, password: form.password }
        : form;
      const { data } = await api.post(endpoint, payload);
      setApiToken(data.token);
      onLoginSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <div className="auth-card auth-card-modern">
        <div className="auth-header">
          <div className="auth-icon-badge"><Layers size={25} /></div>
          <div className="auth-kicker"><ShieldCheck size={13} /> Secure Ledger Workspace</div>
          <h1 className="auth-title">SigmaZero</h1>
          <p className="auth-subtitle">Double-entry accounting with an immutable transaction journal.</p>
        </div>

        <div className="auth-tabs">
          <button type="button" className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`} onClick={() => { setMode('signin'); setError(null); }}>
            <LogIn size={14} /> Sign In
          </button>
          <button type="button" className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(null); }}>
            <UserPlus size={14} /> Create Workspace
          </button>
        </div>

        {error && <div className="alert-box auth-error"><span>{error}</span></div>}

        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label"><Building2 size={13} /> Organization</label>
              <input className="input-text" type="text" required maxLength="100" placeholder="e.g. Apex Global Corp" value={form.organizationName} onChange={(e) => update('organizationName', e.target.value)} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label"><User size={13} /> Email address</label>
            <input className="input-text" type="email" required placeholder="operator@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" />
          </div>

          <div className="form-group">
            <label className="form-label"><Lock size={13} /> Password</label>
            <input className="input-text" type="password" required minLength="8" placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'} value={form.password} onChange={(e) => update('password', e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            <span>{loading ? 'Securing session...' : mode === 'signin' ? 'Sign in securely' : 'Create & provision ledger'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-security-note">
          <Lock size={13} /> Passwords are stored as BCrypt hashes. Ledger APIs require an authenticated JWT session.
        </div>
      </div>
    </div>
  );
};
