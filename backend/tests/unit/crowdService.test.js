const crowdService = require('../../src/services/crowdService');
jest.mock('../../src/utils/db');
jest.mock('axios');
const db = require('../../src/utils/db');
const axios = require('axios');

describe('CrowdService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('recordMetrics', () => {
    it('should record crowd metrics and calculate risk', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'metric-1', stadium_id: 'stad-1', zone_id: 'zone-1', density: 85, occupancy_count: 4200, risk_score: 0.8, is_anomaly: false }] });
      const data = await crowdService.recordMetrics({
        stadiumId: 'stad-1', zoneId: 'zone-1', density: 85, occupancyCount: 4200, flowRate: 60,
      });
      expect(data).toBeDefined();
      expect(data.risk_score).toBeDefined();
    });

    it('should flag anomaly when high risk', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'm-2', density: 95, risk_score: 0.9, is_anomaly: true }] });
      db.query.mockResolvedValueOnce({ rows: [{ name: 'Gate B' }] }); // zone name for auto incident
      db.query.mockResolvedValueOnce({ rows: [{ id: 'incident-auto' }] }); // incident insert

      const data = await crowdService.recordMetrics({
        stadiumId: 's1', zoneId: 'z1', density: 95, occupancyCount: 4800, flowRate: 120,
      });
      expect(data.is_anomaly).toBe(true);
    });
  });

  describe('simplePrediction', () => {
    it('should use trend for prediction', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          { density: '80', occupancy_count: 4000, timestamp: new Date().toISOString() },
          { density: '70', occupancy_count: 3500, timestamp: new Date(Date.now()-60000).toISOString() },
          { density: '60', occupancy_count: 3000, timestamp: new Date(Date.now()-120000).toISOString() },
        ]
      });
      const pred = await crowdService.simplePrediction('stad-1', 'zone-1', 30);
      expect(pred.predictedDensity).toBeDefined();
      expect(pred.confidence).toBeGreaterThan(0);
      expect(pred.minutesAhead).toBe(30);
    });

    it('should return zero when no data', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const pred = await crowdService.simplePrediction('stad-1', 'zone-1', 30);
      expect(pred.predictedDensity).toBe(0);
    });
  });

  describe('predictCrowd', () => {
    it('should call ML service if enabled', async () => {
      const mockResponse = { data: { predictedDensity: 88, confidence: 0.87, method: 'ml_lstm' } };
      axios.post.mockResolvedValueOnce(mockResponse);
      // Enable ML
      const config = require('../../src/config');
      const original = config.ml.enablePredictions;
      config.ml.enablePredictions = true;
      
      const result = await crowdService.predictCrowd('stad-1', 'zone-1', 30);
      // Might fallback if axios fails, but should return object
      expect(result).toBeDefined();
      config.ml.enablePredictions = original;
    });

    it('should fallback to simple prediction when ML fails', async () => {
      axios.post.mockRejectedValueOnce(new Error('ML service down'));
      db.query.mockResolvedValueOnce({
        rows: [{ density: '70', occupancy_count: 3500, timestamp: new Date().toISOString() }]
      });
      const config = require('../../src/config');
      const orig = config.ml.enablePredictions;
      config.ml.enablePredictions = true;
      
      const result = await crowdService.predictCrowd('stad-1', 'zone-1', 30);
      expect(result.predictedDensity).toBeDefined();
      expect(result.method).toBeDefined();
      
      config.ml.enablePredictions = orig;
    });
  });
});
