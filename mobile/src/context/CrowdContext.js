import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import realtime from '../services/realtime';
import { useAppContext } from './AppContext';

const CrowdContext = createContext();

export function CrowdProvider({ children }) {
  const { stadium } = useAppContext();
  const [crowdData, setCrowdData] = useState([]);
  const [zones, setZones] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState([]);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getZones(stadium.id);
      setZones(res.data || mockZones);
    } catch {
      setZones(mockZones);
    } finally {
      setLoading(false);
    }
  }, [stadium.id]);

  const fetchCrowdMetrics = useCallback(async () => {
    try {
      const res = await api.getCrowdMetrics(stadium.id);
      setCrowdData(res.data || []);
    } catch {
      // Generate mock data for offline
      setCrowdData(Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        zone_id: `${(i % 3)+1}`,
        zone_name: mockZones[i % mockZones.length].name,
        density: 30 + Math.random()*70,
        occupancy_count: Math.floor(1000 + Math.random()*4000),
        timestamp: new Date().toISOString(),
        risk_score: Math.random(),
      })));
    }
  }, [stadium.id]);

  useEffect(() => {
    fetchZones();
    fetchCrowdMetrics();
    realtime.connect(stadium.id);

    const unsubCrowd = realtime.on('crowd_update', (data) => {
      setCrowdData(prev => [data, ...prev.slice(0, 49)]);
    });

    const unsubZone = realtime.on('zone_occupancy', (data) => {
      setZones(prev => prev.map(z => z.id === data.id ? { ...z, current_occupancy: data.current_occupancy } : z));
    });

    const interval = setInterval(fetchCrowdMetrics, 30000);

    return () => {
      unsubCrowd();
      unsubZone();
      clearInterval(interval);
    };
  }, [stadium.id, fetchCrowdMetrics, fetchZones]);

  const getCrowdStatus = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return 'unknown';
    const percent = (zone.current_occupancy / zone.capacity) * 100;
    if (percent >= 90) return 'critical';
    if (percent >= 80) return 'high';
    if (percent >= 50) return 'medium';
    return 'low';
  };

  return (
    <CrowdContext.Provider value={{
      crowdData, zones, heatmap, selectedZone, setSelectedZone,
      loading, anomalies, fetchCrowdMetrics, fetchZones, getCrowdStatus,
    }}>
      {children}
    </CrowdContext.Provider>
  );
}

const mockZones = [
  { id: '1', name: 'North Entrance Gate A', code: 'N-A', type: 'entrance', capacity: 5000, current_occupancy: 3200, status: 'open' },
  { id: '2', name: 'South Entrance Gate B', code: 'S-B', type: 'entrance', capacity: 5000, current_occupancy: 4100, status: 'open' },
  { id: '3', name: 'East Seating Lower', code: 'E-LOW-1', type: 'seating', capacity: 15000, current_occupancy: 14200, status: 'open' },
  { id: '4', name: 'Main Concourse', code: 'CONC-M', type: 'concourse', capacity: 10000, current_occupancy: 7400, status: 'open' },
  { id: '5', name: 'VIP Lounge', code: 'VIP-3', type: 'vip', capacity: 500, current_occupancy: 320, status: 'open' },
];

export function useCrowdContext() {
  const ctx = useContext(CrowdContext);
  if (!ctx) throw new Error('useCrowdContext must be used within CrowdProvider');
  return ctx;
}
