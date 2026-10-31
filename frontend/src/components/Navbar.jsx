import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>💰 BudgetBridge</div>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Dashboard</Link>
        <Link to="/transactions" style={styles.link}>Transactions</Link>
        <Link to="/budgets" style={styles.link}>Budgets</Link>
      </div>
      <div style={styles.user}>
        <span style={styles.userName}>{user?.name}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 32px', background:'#1a1f2e', color:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,0.3)' },
  brand: { fontSize:'1.4rem', fontWeight:'700', color:'#4ade80' },
  links: { display:'flex', gap:'24px' },
  link: { color:'#cbd5e1', textDecoration:'none', fontSize:'0.95rem', fontWeight:'500' },
  user: { display:'flex', alignItems:'center', gap:'12px' },
  userName: { color:'#94a3b8', fontSize:'0.9rem' },
  logoutBtn: { background:'#ef4444', color:'#fff', border:'none', padding:'6px 14px', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem' }
};
