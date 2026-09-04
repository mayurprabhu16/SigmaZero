import React, { useState, useEffect } from 'react';
import api from './api';
import { Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTenant } from './TenantContext';

export const BalancedJournalForm = ({ onEntryPosted }) => {
  const { activeTenant } = useTenant();
  const [accounts, setAccounts] = useState([]);
  const [referenceId, setReferenceId] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState([
    { accountId: '', direction: 'DEBIT', amount: '' },
    { accountId: '', direction: 'CREDIT', amount: '' },
  ]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeTenant) {
      api.get('/accounts')
        .then((res) => setAccounts(res.data))
        .catch((err) => console.error('Error fetching accounts:', err));
    }
  }, [activeTenant]);

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const addLine = () => {
    setLines([...lines, { accountId: '', direction: 'DEBIT', amount: '' }]);
  };

  const removeLine = (index) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const totalDebits = lines
    .filter((l) => l.direction === 'DEBIT')
    .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

  const totalCredits = lines
    .filter((l) => l.direction === 'CREDIT')
    .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

  const variance = Math.abs(totalDebits - totalCredits);
  const isBalanced = variance < 0.0001 && totalDebits > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBalanced) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.post('/journal-entries', {
        referenceId,
        description,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          direction: l.direction,
          amount: parseFloat(l.amount),
        })),
      });

      setReferenceId('');
      setDescription('');
      setLines([
        { accountId: '', direction: 'DEBIT', amount: '' },
        { accountId: '', direction: 'CREDIT', amount: '' },
      ]);
      if (onEntryPosted) onEntryPosted();
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction could not be posted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Record Journal Entry</div>
          <div className="card-subtitle">Ensure total debits strictly equal total credits</div>
        </div>
        <span className="brand-badge" style={{ color: '#818cf8', borderColor: '#4f46e5' }}>Immutable Post</span>
      </div>

      {error && (
        <div className="alert-box">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Reference ID (Idempotency Key)</label>
            <input
              type="text"
              required
              className="input-text"
              placeholder="e.g. TXN-1002"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Memo</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Seed capital injection"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="lines-header">
          <span>Account</span>
          <span>Direction</span>
          <span style={{ textAlign: 'right' }}>Amount</span>
          <span></span>
        </div>

        {lines.map((line, idx) => (
          <div key={idx} className="line-item">
            <select
              required
              className="input-select"
              value={line.accountId}
              onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
            >
              <option value="">Choose account...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name} ({acc.type})
                </option>
              ))}
            </select>

            <select
              className="input-select"
              value={line.direction}
              onChange={(e) => handleLineChange(idx, 'direction', e.target.value)}
            >
              <option value="DEBIT">Debit (DR)</option>
              <option value="CREDIT">Credit (CR)</option>
            </select>

            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="input-text text-right"
              value={line.amount}
              onChange={(e) => handleLineChange(idx, 'amount', e.target.value)}
            />

            <button
              type="button"
              className="btn-icon"
              disabled={lines.length <= 2}
              onClick={() => removeLine(idx)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button type="button" className="btn-add-line" onClick={addLine}>
          <Plus size={16} /> Add Split Leg
        </button>

        <div className="balance-footer">
          <div className="balance-stats">
            <div className="stat-item">
              <span className="stat-label">Total Debits</span>
              <span className="stat-value stat-debit">${totalDebits.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Credits</span>
              <span className="stat-value stat-credit">${totalCredits.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Variance</span>
              <span className={`stat-value ${isBalanced ? 'stat-diff-balanced' : 'stat-diff-unbalanced'}`}>
                ${variance.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="balance-actions">
            <span className={`badge-status ${isBalanced ? 'badge-balanced' : 'badge-unbalanced'}`}>
              {isBalanced ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {isBalanced ? 'Balanced' : 'Imbalance'}
            </span>

            <button type="submit" className="btn-submit" disabled={!isBalanced || isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Commit to Ledger'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};