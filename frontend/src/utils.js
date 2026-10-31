// "2026-03-05" -> local date string, without the off-by-one-day timezone bug
// you get from new Date("2026-03-05").
export const formatDate = (value) => {
  if (!value) return '';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
};

export const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
