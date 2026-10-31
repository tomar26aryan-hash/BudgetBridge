import React, { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import { formatDate } from '../utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#4ade80','#f87171','#60a5fa','#fbbf24','#a78bfa','#34d399'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [sum, cat] = await Promise.all([
          api.get('/api/dashboard/summary'),
          api.get('/api/transactions/by-category')
        ]);
        setSummary(sum.data);
        setCategoryData(cat.data);
      } catch (err) {
        setError(errorMessage(err, 'Could not load your dashboard.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={styles.loading}>Loading your finances...</div>;
  if (error) return <div style={styles.loading}>{error}</div>;

  const monthlyChartData = MONTHS.map((m, i) => {
    const income = summary.monthlyData.find(d => d.month === i+1 && d.type === 'income');
    const expense = summary.monthlyData.find(d => d.month === i+1 && d.type === 'expense');
    return { month: m, Income: income?.total || 0, Expense: expense?.total || 0 };
  }).filter(d => d.Income > 0 || d.Expense > 0);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>

      {/* Summary Cards */}
      <div style={styles.cardRow}>
        <div style={{...styles.card, borderTop:'4px solid #4ade80'}}>
          <div style={styles.cardLabel}>Income · This Month</div>
          <div style={{...styles.cardValue, color:'#4ade80'}}>₹{Number(summary.totalIncome).toLocaleString()}</div>
        </div>
        <div style={{...styles.card, borderTop:'4px solid #f87171'}}>
          <div style={styles.cardLabel}>Expenses · This Month</div>
          <div style={{...styles.cardValue, color:'#f87171'}}>₹{Number(summary.totalExpense).toLocaleString()}</div>
        </div>
        <div style={{...styles.card, borderTop:'4px solid #60a5fa'}}>
          <div style={styles.cardLabel}>Net · This Month</div>
          <div style={{...styles.cardValue, color:'#60a5fa'}}>₹{Number(summary.balance).toLocaleString()}</div>
        </div>
      </div>

      {/* Charts */}
      <div style={styles.chartRow}>
        <div style={styles.chartBox}>
          <h3 style={styles.chartTitle}>Monthly Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyChartData}>
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{background:'#1e293b',border:'none',color:'#fff'}} />
              <Legend />
              <Bar dataKey="Income" fill="#4ade80" radius={[4,4,0,0]} />
              <Bar dataKey="Expense" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartBox}>
          <h3 style={styles.chartTitle}>Spending by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({category}) => category}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{background:'#1e293b',border:'none',color:'#fff'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={styles.recentBox}>
        <h3 style={styles.chartTitle}>Recent Transactions</h3>
        <table style={styles.table}>
          <thead><tr>{['Title','Amount','Type','Category','Date'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
          <tbody>
            {summary.recentTransactions.length === 0 && (
              <tr><td colSpan={5} style={{...styles.td, color:'#64748b', textAlign:'center'}}>No transactions yet. Add your first one from the Transactions page.</td></tr>
            )}
            {summary.recentTransactions.map(t => (
              <tr key={t.id} style={styles.tr}>
                <td style={styles.td}>{t.title}</td>
                <td style={{...styles.td, color: t.type==='income'?'#4ade80':'#f87171'}}>₹{Number(t.amount).toLocaleString()}</td>
                <td style={styles.td}><span style={{...styles.badge, background: t.type==='income'?'#166534':'#7f1d1d'}}>{t.type}</span></td>
                <td style={styles.td}>{t.category}</td>
                <td style={styles.td}>{formatDate(t.date)}</td>
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
  title: { fontSize:'1.8rem', fontWeight:'700', marginBottom:'24px', color:'#f1f5f9' },
  loading: { display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'#94a3b8', fontSize:'1.2rem', background:'#0f172a' },
  cardRow: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px', marginBottom:'32px' },
  card: { background:'#1e293b', borderRadius:'12px', padding:'24px', boxShadow:'0 4px 12px rgba(0,0,0,0.2)' },
  cardLabel: { color:'#94a3b8', fontSize:'0.85rem', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.05em' },
  cardValue: { fontSize:'2rem', fontWeight:'700' },
  chartRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'32px' },
  chartBox: { background:'#1e293b', borderRadius:'12px', padding:'24px' },
  chartTitle: { color:'#f1f5f9', marginBottom:'16px', fontSize:'1rem', fontWeight:'600' },
  recentBox: { background:'#1e293b', borderRadius:'12px', padding:'24px' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { textAlign:'left', padding:'10px 16px', color:'#64748b', fontSize:'0.8rem', textTransform:'uppercase', borderBottom:'1px solid #334155' },
  td: { padding:'12px 16px', borderBottom:'1px solid #1e293b', fontSize:'0.9rem' },
  tr: { transition:'background 0.2s' },
  badge: { padding:'3px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'600', textTransform:'uppercase' }
};
