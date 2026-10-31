import React, { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';

const CATEGORIES = ['Food','Transport','Entertainment','Utilities','Shopping','Health','Education','Other'];

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({ category: 'Food', limit_amount: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchBudgets(); }, []);

  const fetchBudgets = async () => {
    try {
      const res = await api.get('/api/budgets');
      setBudgets(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load budgets.'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/budgets', form);
      setForm({ category: 'Food', limit_amount: '' });
      setShowForm(false);
      await fetchBudgets();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the budget.'));
    }
  };

  const getPercent = (spent, limit) => (limit > 0 ? Math.min((spent / limit) * 100, 100) : 0);
  const getColor = (pct) => pct >= 90 ? '#ef4444' : pct >= 70 ? '#fbbf24' : '#4ade80';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Budgets</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>+ Set Budget</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>Set Monthly Budget</h3>
          <div style={styles.formRow}>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={styles.input}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" min="1" step="0.01" placeholder="Limit Amount (₹)" value={form.limit_amount}
              onChange={e => setForm({...form, limit_amount: e.target.value})} required style={styles.input} />
            <button type="submit" style={styles.submitBtn}>Save</button>
          </div>
        </form>
      )}

      <div style={styles.grid}>
        {budgets.length === 0 && (
          <div style={styles.empty}>No budgets set yet. Click "Set Budget" to get started!</div>
        )}
        {budgets.map(b => {
          const pct = getPercent(b.spent, b.limit_amount);
          const color = getColor(pct);
          return (
            <div key={b.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.category}>{b.category}</span>
                <span style={{color, fontWeight:'700', fontSize:'0.9rem'}}>{pct.toFixed(0)}% used</span>
              </div>
              <div style={styles.progressBg}>
                <div style={{...styles.progressFill, width:`${pct}%`, background: color}} />
              </div>
              <div style={styles.amounts}>
                <span style={{color:'#94a3b8'}}>Spent: <span style={{color:'#f87171'}}>₹{Number(b.spent).toLocaleString()}</span></span>
                <span style={{color:'#94a3b8'}}>Limit: <span style={{color:'#4ade80'}}>₹{Number(b.limit_amount).toLocaleString()}</span></span>
              </div>
              {pct >= 90 && <div style={styles.alert}>⚠️ Budget almost exhausted!</div>}
            </div>
          );
        })}
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
  formRow: { display:'flex', gap:'12px', alignItems:'center' },
  input: { background:'#0f172a', border:'1px solid #334155', color:'#e2e8f0', padding:'10px 14px', borderRadius:'8px', fontSize:'0.9rem', flex:1 },
  submitBtn: { background:'#4ade80', color:'#0f172a', border:'none', padding:'10px 24px', borderRadius:'8px', cursor:'pointer', fontWeight:'700' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px' },
  card: { background:'#1e293b', borderRadius:'12px', padding:'24px' },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' },
  category: { fontSize:'1.1rem', fontWeight:'600', color:'#f1f5f9' },
  progressBg: { background:'#0f172a', borderRadius:'99px', height:'10px', marginBottom:'14px', overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:'99px', transition:'width 0.4s ease' },
  amounts: { display:'flex', justifyContent:'space-between', fontSize:'0.88rem' },
  alert: { marginTop:'12px', color:'#fbbf24', fontSize:'0.85rem', fontWeight:'500' },
  error: { background:'#7f1d1d', color:'#fca5a5', padding:'12px', borderRadius:'8px', marginBottom:'20px', fontSize:'0.88rem' },
  empty: { color:'#64748b', gridColumn:'1/-1', textAlign:'center', padding:'48px', fontSize:'1rem' }
};
