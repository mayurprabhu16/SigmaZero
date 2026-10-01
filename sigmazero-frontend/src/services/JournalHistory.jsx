import React, { useEffect, useMemo, useState } from 'react';
import api from './api';
import { BookOpen, RefreshCw, Search, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useTenant } from './TenantContext';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export const JournalHistory = ({ refreshTrigger }) => {
  const { activeTenant } = useTenant();
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJournal = async () => {
    if (!activeTenant) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/journal-entries');
      setEntries(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load transaction journal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJournal(); }, [refreshTrigger, activeTenant]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) =>
      [entry.referenceId, entry.description, ...entry.lines.map((line) => `${line.accountCode} ${line.accountName}`)]
        .some((value) => value?.toLowerCase().includes(q))
    );
  }, [entries, search]);

  return (
    <div className="card journal-card">
      <div className="card-header journal-header">
        <div>
          <div className="card-title journal-title"><BookOpen size={18} /> Transaction Journal</div>
          <div className="card-subtitle">Complete append-only history of every posted transaction and its ledger legs</div>
        </div>
        <div className="journal-tools">
          <div className="journal-search"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference, account..." /></div>
          <button className="btn-icon" onClick={fetchJournal} title="Refresh journal"><RefreshCw size={16} /></button>
        </div>
      </div>

      {error && <div className="alert-box"><span>{error}</span></div>}
      {loading ? <div className="journal-empty">Loading transaction history...</div> : filtered.length === 0 ? <div className="journal-empty">No transactions match your search.</div> : (
        <div className="journal-list">
          {filtered.map((entry, index) => {
            const debit = entry.lines.filter((l) => l.direction === 'DEBIT').reduce((sum, l) => sum + Number(l.amount), 0);
            const credit = entry.lines.filter((l) => l.direction === 'CREDIT').reduce((sum, l) => sum + Number(l.amount), 0);
            return (
              <article className="journal-entry" key={entry.id}>
                <div className="journal-entry-top">
                  <div className="journal-ref"><span className="journal-number">#{filtered.length - index}</span><strong>{entry.referenceId}</strong><span className="journal-date">{new Date(entry.postedAt).toLocaleString()}</span></div>
                  <span className="badge-status badge-balanced">Balanced</span>
                </div>
                {entry.description && <p className="journal-description">{entry.description}</p>}
                <div className="journal-lines">
                  {entry.lines.map((line) => (
                    <div className="journal-line" key={line.lineId}>
                      <div className="journal-account"><span className={`direction-icon ${line.direction === 'DEBIT' ? 'debit' : 'credit'}`}>{line.direction === 'DEBIT' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}</span><span><b>{line.accountCode}</b> {line.accountName}</span></div>
                      <span className={`journal-direction ${line.direction.toLowerCase()}`}>{line.direction}</span>
                      <span className="journal-amount">{money(line.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="journal-total"><span>Transaction total</span><span>DR {money(debit)} &nbsp; / &nbsp; CR {money(credit)}</span></div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
