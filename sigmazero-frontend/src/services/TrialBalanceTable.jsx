import React, { useEffect, useState } from 'react';
import api from './api';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTenant } from './TenantContext';

export const TrialBalanceTable = ({ refreshTrigger }) => {
  const { activeTenant } = useTenant();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const res = await api.get('/reports/trial-balance');
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load trial balance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [refreshTrigger, activeTenant]);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Trial Balance Sheet</div>
          <div className="card-subtitle">Aggregated debit and credit sums per ledger account</div>
        </div>
        <button className="btn-icon" onClick={fetchReport} title="Refresh sheet">
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Computing positions...
        </div>
      ) : !report || !report.rows || report.rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No account activity recorded yet.
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th className="text-right">Debit Balance</th>
                <th className="text-right">Credit Balance</th>
                <th className="text-right">Net Value</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.accountId}>
                  <td className="code-col">{row.accountCode}</td>
                  <td className="name-col">{row.accountName}</td>
                  <td>
                    <span className="type-badge">{row.accountType}</span>
                  </td>
                  <td className="text-right">${Number(row.totalDebit).toFixed(2)}</td>
                  <td className="text-right">${Number(row.totalCredit).toFixed(2)}</td>
                  <td className="text-right" style={{ color: '#fff' }}>${Number(row.netBalance).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-footer">
                <td colSpan="3" style={{ color: 'var(--text-secondary)' }}>TOTAL</td>
                <td className="text-right" style={{ color: 'var(--success)' }}>
                  ${Number(report.totalDebits || 0).toFixed(2)}
                </td>
                <td className="text-right" style={{ color: 'var(--cyan)' }}>
                  ${Number(report.totalCredits || 0).toFixed(2)}
                </td>
                <td className="text-right">
                  <span className={`badge-status ${report.isBalanced ? 'badge-balanced' : 'badge-unbalanced'}`} style={{ display: 'inline-flex' }}>
                    {report.isBalanced ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {report.isBalanced ? 'Balanced' : 'Imbalance'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};