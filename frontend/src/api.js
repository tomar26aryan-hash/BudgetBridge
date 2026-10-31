import axios from 'axios';

// In the default single-service deployment the API is on the same domain, so
// the base URL is empty and calls like "/api/transactions" just work.
// If you host the frontend separately, set REACT_APP_API_URL at BUILD time
// (e.g. https://budgetbridge-api.onrender.com).
const baseURL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

const api = axios.create({ baseURL });

// Read the token on every request so it is always current (also right after a
// page refresh, before any React effect has run).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token has expired or is invalid, send the user back to the login page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = (err.config?.url || '').includes('/api/auth/');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('bb_token');
      localStorage.removeItem('bb_user');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || (err?.request ? 'Cannot reach the server. Please try again.' : fallback);

export default api;
