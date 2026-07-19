const db = require('../utils/db');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const { calculateRiskScore } = require('../utils/helpers');

class CrowdService {
  async recordMetrics(data) {
    const { stadiumId, zoneId, eventId, density, flowRate, occupancyCount, occupancyPercentage, averageSpeed, temperature, noiseLevel, sensorData } = data;
    
    const occupancyPercent = occupancyPercentage || (density ? density : 0);
    const riskScore = calculateRiskScore(density || 0, flowRate || 0, occupancyPercent || 0);
    const isAnomaly = riskScore > 0.8 || (density && density > 90);

    const result = await db.query(
      `INSERT INTO crowd_metrics (stadium_id, zone_id, event_id, density, flow_rate, occupancy_count, occupancy_percentage, average_speed, temperature, noise_level, risk_score, is_anomaly, sensor_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [stadiumId, zoneId, eventId, density, flowRate, occupancyCount, occupancyPercent, averageSpeed, temperature, noiseLevel, riskScore, isAnomaly, sensorData ? JSON.stringify(sensorData) : '{}']
    );

    // If anomaly, auto-create incident if critical
    if (isAnomaly && riskScore > 0.85) {
      await this.createAutoIncident(stadiumId, zoneId, eventId, result.rows[0]);
    }

    return result.rows[0];
  }

  async createAutoIncident(stadiumId, zoneId, eventId, metric) {
    try {
      const zoneRes = await db.query('SELECT name FROM zones WHERE id = $1', [zoneId]);
      const zoneName = zoneRes.rows[0]?.name || zoneId;
      await db.query(
        `INSERT INTO incidents (stadium_id, zone_id, event_id, type, severity, title, description, ai_predicted, ai_confidence)
         VALUES ($1,$2,$3,'crowd','high',$4,$5,true,$6)`,
        [stadiumId, zoneId, eventId, `High crowding detected in ${zoneName}`, `Automated alert: Density ${metric.density}%, Occupancy ${metric.occupancy_count}, Risk ${metric.risk_score}`, metric.risk_score]
      );
      logger.warn('Auto incident created for crowding', { zoneId, risk: metric.risk_score });
    } catch (e) {
      logger.error('Failed to create auto incident', { error: e.message });
    }
  }

  async getMetrics(filters = {}) {
    let query = `SELECT cm.*, z.name as zone_name, z.code as zone_code, s.name as stadium_name FROM crowd_metrics cm 
                 JOIN zones z ON z.id = cm.zone_id JOIN stadiums s ON s.id = cm.stadium_id WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (filters.stadiumId) { query += ` AND cm.stadium_id = $${idx}`; params.push(filters.stadiumId); idx++; }
    if (filters.zoneId) { query += ` AND cm.zone_id = $${idx}`; params.push(filters.zoneId); idx++; }
    if (filters.eventId) { query += ` AND cm.event_id = $${idx}`; params.push(filters.eventId); idx++; }
    if (filters.from) { query += ` AND cm.timestamp >= $${idx}`; params.push(filters.from); idx++; }
    if (filters.to) { query += ` AND cm.timestamp <= $${idx}`; params.push(filters.to); idx++; }
    if (filters.anomalyOnly) { query += ` AND cm.is_anomaly = true`; }
    query += ` ORDER BY cm.timestamp DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(filters.limit || 100, filters.offset || 0);
    const result = await db.query(query, params);
    return result.rows;
  }

  async getHeatmapData(stadiumId, eventId = null) {
    const query = eventId 
      ? `SELECT zone_id, AVG(density) as avg_density, MAX(density) as max_density, AVG(occupancy_percentage) as avg_occupancy, 
         COUNT(*) as reading_count FROM crowd_metrics WHERE stadium_id = $1 AND event_id = $2 AND timestamp > NOW() - INTERVAL '1 hour' GROUP BY zone_id`
      : `SELECT zone_id, AVG(density) as avg_density, MAX(density) as max_density, AVG(occupancy_percentage) as avg_occupancy FROM crowd_metrics WHERE stadium_id = $1 AND timestamp > NOW() - INTERVAL '1 hour' GROUP BY zone_id`;
    const params = eventId ? [stadiumId, eventId] : [stadiumId];
    const result = await db.query(query, params);
    
    // Merge with zone info
    const zones = await db.query('SELECT id, name, code, type, coordinates FROM zones WHERE stadium_id = $1', [stadiumId]);
    const zoneMap = new Map(zones.rows.map(z => [z.id, z]));
    
    return result.rows.map(r => ({
      zoneId: r.zone_id,
      zone: zoneMap.get(r.zone_id) || null,
      avgDensity: parseFloat(r.avg_density),
      maxDensity: parseFloat(r.max_density),
      avgOccupancy: parseFloat(r.avg_occupancy),
      readingCount: parseInt(r.reading_count || 0,10),
    }));
  }

  async predictCrowd(stadiumId, zoneId, futureMinutes = 30) {
    if (!config.ml.enablePredictions) {
      return this.simplePrediction(stadiumId, zoneId, futureMinutes);
    }
    try {
      const response = await axios.post(`${config.ml.serviceUrl}/predict/crowd`, {
        stadium_id: stadiumId,
        zone_id: zoneId,
        minutes_ahead: futureMinutes,
      }, { timeout: 5000 });
      return response.data;
    } catch (e) {
      logger.warn('ML prediction failed, fallback', { error: e.message });
      return this.simplePrediction(stadiumId, zoneId, futureMinutes);
    }
  }

  async simplePrediction(stadiumId, zoneId, minutes) {
    const result = await db.query(
      `SELECT density, occupancy_count, timestamp FROM crowd_metrics WHERE zone_id = $1 ORDER BY timestamp DESC LIMIT 10`,
      [zoneId]
    );
    if (result.rows.length === 0) return { predictedDensity: 0, confidence: 0, method: 'fallback' };
    
    const avgDensity = result.rows.reduce((sum, r) => sum + parseFloat(r.density || 0), 0) / result.rows.length;
    const trend = result.rows.length >= 2 ? (parseFloat(result.rows[0].density) - parseFloat(result.rows[result.rows.length-1].density)) / result.rows.length : 0;
    const predicted = Math.min(100, Math.max(0, avgDensity + trend * (minutes/5)));
    
    return {
      zoneId,
      stadiumId,
      currentDensity: parseFloat(result.rows[0].density),
      predictedDensity: Math.round(predicted * 100)/100,
      predictedOccupancy: Math.round(predicted * 1.2),
      minutesAhead: minutes,
      confidence: 0.65,
      method: 'simple_trend',
      timestamp: new Date().toISOString(),
    };
  }

  async getPeakHours(stadiumId, eventId) {
    const result = await db.query(
      `SELECT EXTRACT(HOUR FROM timestamp) as hour, AVG(density) as avg_density, MAX(density) as max_density, COUNT(*) as samples
       FROM crowd_metrics WHERE stadium_id = $1 ${eventId ? 'AND event_id = $2' : ''} GROUP BY hour ORDER BY hour`,
      eventId ? [stadiumId, eventId] : [stadiumId]
    );
    return result.rows;
  }

  async getAnomalies(stadiumId, limit = 20) {
    const result = await db.query(
      `SELECT cm.*, z.name as zone_name FROM crowd_metrics cm JOIN zones z ON z.id = cm.zone_id WHERE cm.stadium_id = $1 AND cm.is_anomaly = true ORDER BY cm.timestamp DESC LIMIT $2`,
      [stadiumId, limit]
    );
    return result.rows;
  }
}

module.exports = new CrowdService();
