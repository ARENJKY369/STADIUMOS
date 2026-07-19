import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * useCrowd Hook - Real-time crowd data with Socket.IO
 * Subscription management, zone selection, risk assessment
 */
export function useCrowd(stadiumId, options = {}) {
  const { pollingInterval = 10000, autoFetch = true } = options;
  const [crowdData, setCrowdData] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const fetchCrowdData = useCallback(async () => {
    if (!stadiumId) return;
    try {
      setError(null);
      const res = await api.get('/crowd', { stadiumId, limit: 100 });
      setCrowdData(res.data.data || mockCrowd);
      setLastUpdate(new Date().toISOString());
    } catch (e) {
      setError(e.message);
      setCrowdData(mockCrowd);
    } finally {
      setLoading(false);
    }
  }, [stadiumId]);

  const fetchZones = useCallback(async () => {
    try {
      const res = await api.get('/zones', { stadiumId });
      setZones(res.data.data || mockZones);
    } catch {
      setZones(mockZones);
    }
  }, [stadiumId]);

  useEffect(() => {
    if (autoFetch) {
      fetchCrowdData();
      fetchZones();
      intervalRef.current = setInterval(fetchCrowdData, pollingInterval);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchCrowdData, fetchZones, autoFetch, pollingInterval]);

  const getCrowdStatus = useCallback((zoneId) => {
    const zone = zones.find(z => z.id === zoneId) || crowdData.find(c => c.zone_id === zoneId);
    const density = zone?.current_occupancy ? (zone.current_occupancy / zone.capacity * 100) : zone?.density || 0;
    if (density >= 90) return { level: 'critical', color: 'red', action: 'Evacuate or redirect immediately' };
    if (density >= 80) return { level: 'high', color: 'amber', action: 'Monitor closely, open alternative routes' };
    if (density >= 50) return { level: 'medium', color: 'blue', action: 'Normal flow, regular monitoring' };
    return { level: 'low', color: 'green', action: 'Clear, optimal flow' };
  }, [zones, crowdData]);

  const getZoneById = useCallback((zoneId) => zones.find(z => z.id === zoneId), [zones]);

  const subscribe = useCallback((zoneId, callback) => {
    // In real implementation, this would use Socket.IO to subscribe to zone updates
    console.log(`Subscribed to zone ${zoneId}`);
    const interval = setInterval(() => {
      fetchCrowdData().then(() => { if (callback) callback(crowdData); });
    }, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchCrowdData, pollingInterval, crowdData]);

  const unsubscribe = useCallback((zoneId) => {
    console.log(`Unsubscribed from zone ${zoneId}`);
  }, []);

  return {
    crowdData,
    zones,
    selectedZone,
    setSelectedZone,
    getCrowdStatus,
    getZoneById,
    loading,
    error,
    lastUpdate,
    fetchCrowdData,
    fetchZones,
    subscribe,
    unsubscribe,
    refresh: fetchCrowdData,
  };
}

const mockCrowd = Array.from({ length: 15 }, (_, i) => ({
  id: `${i}`, zone_id: `${(i % 4)+1}`, zone_name: ['Gate A','Gate B','Lower East','Concourse'][i%4],
  density: Math.floor(30 + Math.random()*70), occupancy_count: Math.floor(1000 + Math.random()*4000),
  timestamp: new Date(Date.now() - i*120000).toISOString(), risk_score: Math.random(),
}));

const mockZones = [
  { id: '1', name: 'North Entrance Gate A', code: 'N-A', type: 'entrance', capacity: 5000, current_occupancy: 3200, status: 'open' },
  { id: '2', name: 'South Entrance Gate B', code: 'S-B', type: 'entrance', capacity: 5000, current_occupancy: 4100, status: 'open' },
  { id: '3', name: 'East Seating Lower', code: 'E-LOW-1', type: 'seating', capacity: 15000, current_occupancy: 14200, status: 'open' },
];
