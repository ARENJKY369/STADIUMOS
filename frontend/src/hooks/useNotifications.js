import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useNotifications(options = {}) {
  const { autoFetch = true, pollingInterval = 30000 } = options;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/notifications?limit=20');
      const data = res.data.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (e) {
      setError(e.message);
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, autoFetch, pollingInterval]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev.slice(0,19)]);
    if (!notification.is_read) setUnreadCount(prev => prev + 1);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    refresh: fetchNotifications,
  };
}

const mockNotifications = [
  { id: '1', title: 'High crowd at Gate B', message: 'Density 82% - recommend opening Gate C', type: 'warning', is_read: false, created_at: new Date().toISOString() },
  { id: '2', title: 'Incident resolved', message: 'Medical assistance at Gate A completed', type: 'info', is_read: false, created_at: new Date(Date.now()-3600000).toISOString() },
  { id: '3', title: 'Sustainability milestone', message: 'Stadium saved 1 ton CO₂ today!', type: 'info', is_read: true, created_at: new Date(Date.now()-7200000).toISOString() },
];
