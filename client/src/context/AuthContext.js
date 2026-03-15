import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Configure axios defaults
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (warNumber, password) => {
    const res = await api.post('/auth/login', { warNumber, password });
    if (res.data.firstLogin) return { firstLogin: true, warNumber: res.data.warNumber, warName: res.data.warName };
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
    return { firstLogin: false };
  };

  const setPassword = async (warNumber, password) => {
    const res = await api.post('/auth/set-password', { warNumber, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const registerAdmin = async (data) => {
    const res = await api.post('/auth/register-admin', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setPassword, registerAdmin, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export { api };
