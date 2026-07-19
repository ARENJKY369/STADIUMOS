import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import storage from '../utils/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const storedUser = await storage.getItem('user');
      if (token && storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        // Verify with backend
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch {
          // Token invalid, clear
          await logout();
        }
      }
    } catch (e) {
      console.error('Auth check failed', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (e) {
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await storage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (updates) => {
    try {
      const res = await api.put('/auth/me', updates);
      const updatedUser = res.data;
      setUser(updatedUser);
      await storage.setItem('user', updatedUser);
      return updatedUser;
    } catch (e) {
      console.error('Update profile failed', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, updateProfile, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
