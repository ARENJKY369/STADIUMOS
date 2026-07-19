/**
 * Auth Service - Frontend
 * JWT management, login, register, token refresh
 * Secure storage abstraction
 */
import api from './api';

class AuthService {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data.data;
    this.setTokens(accessToken, refreshToken);
    this.setUser(user);
    return response.data.data;
  }

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  }

  async getProfile() {
    const response = await api.get('/auth/me');
    this.setUser(response.data.data);
    return response.data.data;
  }

  async updateProfile(updates) {
    const response = await api.put('/auth/me', updates);
    this.setUser(response.data.data);
    return response.data.data;
  }

  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data.data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefresh } = response.data.data;
    this.setTokens(accessToken, newRefresh);
    return accessToken;
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  }

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }

  getToken() {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}

export default new AuthService();
