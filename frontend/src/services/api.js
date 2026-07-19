import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const { accessToken } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const mockData = {
  stadium: { id: '1', name: 'MetLife Stadium', city: 'East Rutherford', capacity: 82500 },
  events: [
    { id: '1', name: 'USA vs Mexico', home_team: 'USA', away_team: 'Mexico', start_time: '2026-06-11T20:00:00Z', status: 'scheduled', expected_attendance: 80000 },
    { id: '2', name: 'England vs Germany', home_team: 'England', away_team: 'Germany', start_time: '2026-06-12T19:00:00Z', status: 'scheduled', expected_attendance: 78000 },
  ],
  zones: [
    { id: '1', name: 'North Entrance Gate A', code: 'N-A', type: 'entrance', capacity: 5000, current_occupancy: 3200 },
    { id: '2', name: 'South Entrance Gate B', code: 'S-B', type: 'entrance', capacity: 5000, current_occupancy: 4100 },
    { id: '3', name: 'East Seating Lower', code: 'E-LOW-1', type: 'seating', capacity: 15000, current_occupancy: 14200 },
  ],
  crowdMetrics: Array.from({ length: 20 }, (_, i) => ({
    id: `${i}`, zone_id: `${(i % 3)+1}`, zone_name: ['Gate A','Gate B','Lower East'][i%3],
    density: Math.floor(30 + Math.random()*70), occupancy_count: Math.floor(1000 + Math.random()*4000),
    timestamp: new Date(Date.now() - i*60000).toISOString(), risk_score: Math.random(),
  })),
  incidents: [
    { id: '1', title: 'Medical assistance needed Gate A', type: 'medical', severity: 'high', status: 'reported', created_at: new Date().toISOString(), zone_name: 'Gate A' },
    { id: '2', title: 'Crowding at Concourse', type: 'crowd', severity: 'medium', status: 'in_progress', created_at: new Date(Date.now()-3600000).toISOString(), zone_name: 'Main Concourse' },
  ],
};

export default api;
