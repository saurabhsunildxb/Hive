import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { registerUnauthorizedCallback } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hive_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('hive_token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedCallback(logout);
  }, [logout]);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('hive_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (err) {
        console.error('[Auth Init Failed]', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [logout]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.success && response.data?.token) {
      const newToken = response.data.token;
      const newUser = response.data.user;
      localStorage.setItem('hive_token', newToken);
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(response.message || 'Login failed.');
  };

  const signup = async (name, email, password) => {
    const response = await api.post('/auth/signup', { name, email, password });
    if (response.success && response.data?.token) {
      const newToken = response.data.token;
      const newUser = response.data.user;
      localStorage.setItem('hive_token', newToken);
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(response.message || 'Signup failed.');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
