/**
 * Mobile API Service
 * HTTP client with interceptors, retry, offline queue
 * Supports auth token management via SecureStore
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from 'react-native';
import storage from '../utils/storage';

const API_BASE = 'http://localhost:5000/api/v1'; // Expo Constants.manifest?.extra?.apiUrl ||

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 20000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.offlineQueue = [];
    this.isOnline = true;

    this.client.interceptors.request.use(async (config) => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {}
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');
            const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
            const { accessToken } = res.data.data;
            await SecureStore.setItemAsync('accessToken', accessToken);
            original.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(original);
          } catch (refreshError) {
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');
            return Promise.reject(refreshError);
          }
        }
        // Retry logic 2 times
        if (!original._retryCount) original._retryCount = 0;
        if (original._retryCount < 2 && !error.response) {
          original._retryCount += 1;
          await new Promise(r => setTimeout(r, 1000 * original._retryCount));
          return this.client(original);
        }
        return Promise.reject(error);
      }
    );
  }

  async get(url, params = {}) {
    try {
      const res = await this.client.get(url, { params });
      return res.data;
    } catch (e) {
      if (!this.isOnline) this.queueRequest('get', url, params);
      throw e;
    }
  }

  async post(url, data = {}) {
    try {
      const res = await this.client.post(url, data);
      return res.data;
    } catch (e) {
      if (!this.isOnline) this.queueRequest('post', url, data);
      throw e;
    }
  }

  async put(url, data = {}) {
    const res = await this.client.put(url, data);
    return res.data;
  }

  async delete(url) {
    const res = await this.client.delete(url);
    return res.data;
  }

  queueRequest(method, url, data) {
    this.offlineQueue.push({ method, url, data, timestamp: Date.now() });
    storage.setItem('offlineQueue', this.offlineQueue);
    console.log('[API] Queued offline request', method, url);
  }

  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    console.log(`[API] Processing ${this.offlineQueue.length} offline requests`);
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    for (const req of queue) {
      try {
        await this.client[req.method](req.url, req.data);
      } catch (e) {
        console.error('Failed to process queued request', e);
      }
    }
    await storage.setItem('offlineQueue', []);
  }

  // Domain-specific methods
  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = data.data;
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await storage.setItem('user', user);
    return data.data;
  }

  async getEvents(params = {}) { return this.get('/events', params); }
  async getZones(stadiumId) { return this.get('/zones', { stadiumId }); }
  async getCrowdMetrics(stadiumId) { return this.get('/crowd', { stadiumId, limit: 50 }); }
  async getIncidents(stadiumId) { return this.get('/incidents', { stadiumId }); }
  async reportIncident(data) { return this.post('/incidents', data); }
  async getNotifications() { return this.get('/notifications'); }
  async sendChatMessage(message, sessionId, stadiumId, language = 'en') {
    return this.post('/chatbot/chat', { message, sessionId, stadiumId, language });
  }
  async getLeaderboard(stadiumId) { return this.get(`/sustainability/leaderboard/${stadiumId}`); }
  async logSustainability(data) { return this.post('/sustainability', data); }
  async getHeatmap(stadiumId) { return this.get(`/crowd/heatmap/${stadiumId}`); }
}

export default new ApiService();
