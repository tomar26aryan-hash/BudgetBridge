import React, { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext();

const readSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('bb_user'));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Read from localStorage synchronously so the very first render already
  // knows whether the user is logged in (no flash, no race with API calls).
  const [token, setToken] = useState(() => localStorage.getItem('bb_token'));
  const [user, setUser] = useState(readSavedUser);

  const saveSession = (data) => {
    localStorage.setItem('bb_token', data.token);
    localStorage.setItem('bb_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    saveSession(res.data);
  };

  const register = async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password });
    saveSession(res.data);
  };

  const logout = () => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
