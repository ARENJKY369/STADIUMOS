/**
 * Mobile Helpers - Utilities for Stadium Operations
 */

export function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function getRiskLevel(occupancy, capacity) {
  const percent = (occupancy / capacity) * 100;
  if (percent >= 90) return { level: 'critical', color: '#ef4444', label: 'CRITICAL', action: 'Evacuate/Redirect' };
  if (percent >= 80) return { level: 'high', color: '#f59e0b', label: 'HIGH', action: 'Monitor Closely' };
  if (percent >= 50) return { level: 'medium', color: '#3b82f6', label: 'MEDIUM', action: 'Normal' };
  return { level: 'low', color: '#10b981', label: 'LOW', action: 'Clear' };
}

export function formatCarbonFootprint(kg) {
  if (kg < 1) return `${(kg*1000).toFixed(0)}g`;
  return `${kg.toFixed(1)}kg`;
}

export function calculateEcoPoints(transportMode, distance) {
  const pointsMap = { walking: 100, bicycle: 80, bus: 50, train: 60, subway: 55, car: 10, rideshare: 20 };
  return (pointsMap[transportMode] || 10) + Math.floor(distance);
}

export function generateTicketCode(eventId, userId) {
  const prefix = eventId?.substring(0,4).toUpperCase() || 'WC26';
  const random = Math.random().toString(36).substring(2,8).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `${prefix}-${random}-${time}`;
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function truncateText(text, length = 50) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

export function getStadiumImage(stadiumName) {
  const images = {
    'MetLife Stadium': 'https://images.unsplash.com/photo-1574629810360-214f3774381b?w=400',
    'SoFi Stadium': 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400',
  };
  return images[stadiumName] || 'https://images.unsplash.com/photo-1574629810360-214f3774381b?w=400';
}
