import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addMetric } from '../store/slices/crowdSlice';
import { addIncident } from '../store/slices/incidentSlice';
import { addNotification } from '../store/slices/notificationSlice';

export function useSocket(stadiumId) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnected(true);
      if (stadiumId) socket.emit('join_stadium', stadiumId);
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('crowd_update', (data) => {
      dispatch(addMetric(data));
    });

    socket.on('incident_created', (data) => {
      dispatch(addIncident(data));
      dispatch(addNotification({
        id: `inc_${data.id}`,
        title: `New incident: ${data.title}`,
        message: data.description,
        type: data.severity === 'critical' ? 'critical' : 'warning',
        created_at: new Date().toISOString(),
        is_read: false,
      }));
    });

    socket.on('notification', (data) => {
      dispatch(addNotification(data));
    });

    socket.on('emergency_alert', (data) => {
      console.warn('EMERGENCY ALERT:', data);
      // In production, trigger loud audio and modal
      dispatch(addNotification({
        id: data.id || Date.now(),
        title: data.title,
        message: data.message,
        type: 'emergency',
        created_at: new Date().toISOString(),
        is_read: false,
      }));
    });

    socket.on('stadium_stats', (data) => {
      console.log('Stadium stats update:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, [stadiumId, token, dispatch]);

  const emit = (event, data) => {
    socketRef.current?.emit(event, data);
  };

  return { socket: socketRef.current, connected, emit };
}
