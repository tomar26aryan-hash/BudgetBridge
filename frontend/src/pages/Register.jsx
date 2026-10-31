import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>💰</div>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Start managing your finances today</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {[
            { key:'name', label:'Full Name', type:'text', placeholder:'Your name' },
            { key:'email', label:'Email', type:'email', placeholder:'you@example.com' },
            { key:'password', label:'Password (min 8 characters)', type:'password', placeholder:'••••••••', minLength:8 },
            { key:'confirm', label:'Confirm Password', type:'password', placeholder:'••••••••' },
          ].map(f => (
            <div key={f.key} style={styles.field}>
              <label style={styles.label}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                placeholder={f.placeholder} minLength={f.minLength} required style={styles.input} />
            </div>
          ))}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>Already have an account? <Link to="/login" style={styles.link}>Sign In</Link></p>
      </div>
    </div>
  );
}

const styles = {
  page: { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#0f172a' },
  card: { background:'#1e293b', padding:'40px', borderRadius:'16px', width:'100%', maxWidth:'420px', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' },
  logo: { fontSize:'2.5rem', textAlign:'center', marginBottom:'8px' },
  title: { color:'#f1f5f9', fontSize:'1.6rem', fontWeight:'700', textAlign:'center', margin:'0 0 4px' },
  subtitle: { color:'#64748b', textAlign:'center', marginBottom:'28px', fontSize:'0.9rem' },
  error: { background:'#7f1d1d', color:'#fca5a5', padding:'12px', borderRadius:'8px', marginBottom:'20px', fontSize:'0.88rem' },
  field: { marginBottom:'16px' },
  label: { display:'block', color:'#94a3b8', fontSize:'0.85rem', marginBottom:'6px', fontWeight:'500' },
  input: { width:'100%', background:'#0f172a', border:'1px solid #334155', color:'#e2e8f0', padding:'11px 14px', borderRadius:'8px', fontSize:'0.95rem', boxSizing:'border-box' },
  btn: { width:'100%', background:'#3b82f6', color:'#fff', border:'none', padding:'13px', borderRadius:'8px', fontSize:'1rem', fontWeight:'700', cursor:'pointer', marginTop:'8px' },
  footer: { color:'#64748b', textAlign:'center', marginTop:'20px', fontSize:'0.88rem' },
  link: { color:'#4ade80', textDecoration:'none', fontWeight:'600' }
};
