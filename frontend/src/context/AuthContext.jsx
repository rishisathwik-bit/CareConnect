import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('careconnect_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.success) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const saveAuthSession = (newToken, newUser) => {
    localStorage.setItem('careconnect_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success) {
      saveAuthSession(res.token, res.user);
    }
    return res;
  };

  const demoLogin = async (role) => {
    const res = await api.post(`/auth/demo-login/${role}`);
    if (res.success) {
      saveAuthSession(res.token, res.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.success && res.token && res.user && !res.pendingApproval) {
      saveAuthSession(res.token, res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('careconnect_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const role = user?.role || 'guest';
  const isAdmin = role === 'admin';
  const isOps = role === 'operations';
  const isSupport = role === 'support';
  const isProvider = role === 'provider';
  const isCustomer = role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role,
        isAdmin,
        isOps,
        isSupport,
        isProvider,
        isCustomer,
        login,
        demoLogin,
        register,
        logout,
        refreshUser,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
