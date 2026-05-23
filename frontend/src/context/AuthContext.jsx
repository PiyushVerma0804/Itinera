import React, { createContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore authenticated session on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await api.get('/users/me');
        setUser(userData);
      } catch (err) {
        console.error('Session restoration error:', err.message);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [token]);

  const handleRegister = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/users/register', { name, email, password });

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/users/login', { email, password });

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register: handleRegister,
        login: handleLogin,
        logout: handleLogout,
        apiBaseUrl: api.baseUrl
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
