import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>💰</div>
        <h1 style={styles.title}>BudgetBridge</h1>
        <p style={styles.subtitle}>Track. Budget. Save.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              placeholder="you@example.com" required style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              placeholder="••••••••" required style={styles.input} />
          </div>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>Don't have an account? <Link to="/register" style={styles.link}>Register</Link></p>
      </div>
    </div>
  );
}

const styles = {
  page: { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#0f172a' },
  card: { background:'#1e293b', padding:'40px', borderRadius:'16px', width:'100%', maxWidth:'400px', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' },
  logo: { fontSize:'2.5rem', textAlign:'center', marginBottom:'8px' },
  title: { color:'#f1f5f9', fontSize:'1.6rem', fontWeight:'700', textAlign:'center', margin:'0 0 4px' },
  subtitle: { color:'#64748b', textAlign:'center', marginBottom:'32px', fontSize:'0.9rem' },
  error: { background:'#7f1d1d', color:'#fca5a5', padding:'12px', borderRadius:'8px', marginBottom:'20px', fontSize:'0.88rem' },
  field: { marginBottom:'18px' },
  label: { display:'block', color:'#94a3b8', fontSize:'0.85rem', marginBottom:'6px', fontWeight:'500' },
  input: { width:'100%', background:'#0f172a', border:'1px solid #334155', color:'#e2e8f0', padding:'11px 14px', borderRadius:'8px', fontSize:'0.95rem', boxSizing:'border-box' },
  btn: { width:'100%', background:'#3b82f6', color:'#fff', border:'none', padding:'13px', borderRadius:'8px', fontSize:'1rem', fontWeight:'700', cursor:'pointer', marginTop:'8px' },
  footer: { color:'#64748b', textAlign:'center', marginTop:'24px', fontSize:'0.88rem' },
  link: { color:'#4ade80', textDecoration:'none', fontWeight:'600' }
};
