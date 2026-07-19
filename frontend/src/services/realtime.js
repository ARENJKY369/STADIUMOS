/**
 * Real-Time Service - Frontend Socket.IO
 * Live updates for crowd, incidents, notifications
 * Auto-reconnect, room management
 */
import { io } from 'socket.io-client';
import authService from './authService';

class RealtimeService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.stadiumId = null;
    this.reconnectAttempts = 0;
  }

  connect(stadiumId = null) {
    if (this.socket?.connected) return this.socket;

    const token = authService.getToken();
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('[Socket] Connected', this.socket.id);
      if (stadiumId || this.stadiumId) {
        this.joinStadium(stadiumId || this.stadiumId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('[Socket] Disconnected', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Error', err.message);
      this.reconnectAttempts++;
    });

    // Proxy events to internal emitter
    ['crowd_update','crowd_bulk_update','incident_created','incident_updated','notification','notification_broadcast','emergency_alert','zone_created','zone_updated','zone_occupancy_updated','stadium_stats','event_created'].forEach(event => {
      this.socket.on(event, (data) => this.emitLocal(event, data));
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinStadium(stadiumId) {
    this.stadiumId = stadiumId;
    this.socket?.emit('join_stadium', stadiumId);
  }

  joinZone(zoneId) { this.socket?.emit('join_zone', zoneId); }
  leaveZone(zoneId) { this.socket?.emit('leave_zone', zoneId); }

  // Local event bus
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    this.listeners.set(event, this.listeners.get(event).filter(cb => cb !== callback));
  }

  emitLocal(event, data) {
    const cbs = this.listeners.get(event) || [];
    cbs.forEach(cb => { try { cb(data); } catch (e) { console.error('Listener error', e); } });
  }

  emit(event, data) { this.socket?.emit(event, data); }

  // Convenience wrappers matching spec
  onCrowdUpdate(callback) { return this.on('crowd_update', callback); }
  onIncidentAlert(callback) { return this.on('incident_created', callback); }
  onNotification(callback) { return this.on('notification', callback); }
  onEmergencyAlert(callback) { return this.on('emergency_alert', callback); }
}

export default new RealtimeService();
