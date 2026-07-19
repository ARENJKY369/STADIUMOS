/**
 * Real-Time Service - Mobile Socket.IO
 * Handles live updates for crowd, incidents, notifications
 * Auto-reconnect with exponential backoff
 */
import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = 'http://localhost:5000';

class RealtimeService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
    this.reconnectAttempts = 0;
    this.stadiumId = null;
  }

  async connect(stadiumId = null) {
    if (this.socket?.connected) return this.socket;

    const token = await SecureStore.getItemAsync('accessToken').catch(() => null);
    this.stadiumId = stadiumId;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('[Socket] Connected', this.socket.id);
      if (stadiumId) this.socket.emit('join_stadium', stadiumId);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('[Socket] Disconnected', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connect error', err.message);
      this.reconnectAttempts++;
    });

    // Bind standard events
    this.socket.on('crowd_update', (data) => this.emit('crowd_update', data));
    this.socket.on('incident_created', (data) => this.emit('incident_created', data));
    this.socket.on('notification', (data) => this.emit('notification', data));
    this.socket.on('emergency_alert', (data) => this.emit('emergency_alert', data));
    this.socket.on('zone_occupancy_updated', (data) => this.emit('zone_occupancy', data));

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinZone(zoneId) { this.socket?.emit('join_zone', zoneId); }
  leaveZone(zoneId) { this.socket?.emit('leave_zone', zoneId); }
  joinStadium(stadiumId) {
    this.stadiumId = stadiumId;
    this.socket?.emit('join_stadium', stadiumId);
  }

  // Listener management
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
    // Return unsubscribe
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const filtered = this.listeners.get(event).filter(cb => cb !== callback);
    this.listeners.set(event, filtered);
  }

  emit(event, data) {
    const cbs = this.listeners.get(event) || [];
    cbs.forEach(cb => {
      try { cb(data); } catch (e) { console.error('Listener error', e); }
    });
  }

  // Emit to server
  send(event, data) { this.socket?.emit(event, data); }

  reportIncident(data) { this.send('incident_report', data); }
  updateLocation(data) { this.send('staff_location', data); }
}

export default new RealtimeService();
