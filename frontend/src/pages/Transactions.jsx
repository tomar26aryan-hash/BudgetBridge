import React, { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import { formatDate } from '../utils';

const CATEGORIES = ['Food','Transport','Entertainment','Utilities','Shopping','Health','Education','Salary','Freelance','Other'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ title:'', amount:'', type:'expense', category:'Food', date: new Date().toISOString().split('T')[0], note:'' });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/api/transactions');
      setTransactions(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load transactions.'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/api/transactions', form);
      setForm({ title:'', amount:'', type:'expense', category:'Food', date: new Date().toISOString().split('T')[0], note:'' });
      setShowForm(false);
      await fetchTransactions();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the transaction.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/api/transactions/${id}`);
      await fetchTransactions();
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the transaction.'));
    }
  };

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Transactions</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>+ Add Transaction</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>New Transaction</h3>
          <div style={styles.formGrid}>
            <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title:e.target.value})} required style={styles.input} />
            <input type="number" min="0.01" step="0.01" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} required style={styles.input} />
            <select value={form.type} onChange={e => setForm({...form, type:e.target.value})} style={styles.input}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select value={form.category} onChange={e => setForm({...form, category:e.target.value})} style={styles.input}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})} style={styles.input} />
            <input placeholder="Note (optional)" value={form.note} onChange={e => setForm({...form, note:e.target.value})} style={styles.input} />
          </div>
          <button type="submit" disabled={saving} style={styles.submitBtn}>{saving ? 'Saving...' : 'Save Transaction'}</button>
        </form>
      )}

      <div style={styles.filters}>
        {['all','income','expense'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{...styles.filterBtn, background: filter===f ? '#3b82f6' : '#1e293b'}}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>{['Title','Amount','Type','Category','Date','Note',''].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td style={styles.td}>{t.title}</td>
                <td style={{...styles.td, color: t.type==='income'?'#4ade80':'#f87171', fontWeight:'600'}}>₹{Number(t.amount).toLocaleString()}</td>
                <td style={styles.td}><span style={{...styles.badge, background: t.type==='income'?'#166534':'#7f1d1d'}}>{t.type}</span></td>
                <td style={styles.td}>{t.category}</td>
                <td style={styles.td}>{formatDate(t.date)}</td>
                <td style={{...styles.td, color:'#64748b'}}>{t.note || '-'}</td>
                <td style={styles.td}><button onClick={() => handleDelete(t.id)} style={styles.deleteBtn}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { padding:'32px', background:'#0f172a', minHeight:'100vh', color:'#e2e8f0' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' },
  title: { fontSize:'1.8rem', fontWeight:'700', color:'#f1f5f9' },
  addBtn: { background:'#3b82f6', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'600' },
  form: { background:'#1e293b', padding:'24px', borderRadius:'12px', marginBottom:'24px' },
  formTitle: { color:'#f1f5f9', marginBottom:'16px' },
  formGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' },
  input: { background:'#0f172a', border:'1px solid #334155', color:'#e2e8f0', padding:'10px 14px', borderRadius:'8px', fontSize:'0.9rem', width:'100%', boxSizing:'border-box' },
  submitBtn: { background:'#4ade80', color:'#0f172a', border:'none', padding:'10px 24px', borderRadius:'8px', cursor:'pointer', fontWeight:'700' },
  filters: { display:'flex', gap:'12px', marginBottom:'20px' },
  filterBtn: { border:'none', color:'#e2e8f0', padding:'8px 20px', borderRadius:'20px', cursor:'pointer', fontWeight:'500' },
  tableWrap: { background:'#1e293b', borderRadius:'12px', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { textAlign:'left', padding:'14px 16px', color:'#64748b', fontSize:'0.8rem', textTransform:'uppercase', borderBottom:'1px solid #334155' },
  td: { padding:'14px 16px', borderBottom:'1px solid #0f172a', fontSize:'0.9rem' },
  badge: { padding:'3px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'600' },
  error: { background:'#7f1d1d', color:'#fca5a5', padding:'12px', borderRadius:'8px', marginBottom:'20px', fontSize:'0.88rem' },
  deleteBtn: { background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'1rem' }
};
