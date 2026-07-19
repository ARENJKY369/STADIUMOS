const db = require('../utils/db');
const logger = require('../utils/logger');
const { calculateCarbonFootprint, calculateEcoPoints } = require('../utils/helpers');

class SustainabilityService {
  async logMetric(data) {
    const { stadiumId, eventId, userId, category, metricName, value, unit, transportMode, distanceKm, wasteType, energySource, metadata } = data;
    
    let carbonFootprint = 0;
    let ecoPoints = 0;

    if (category === 'transport' && transportMode && distanceKm) {
      carbonFootprint = calculateCarbonFootprint(transportMode, distanceKm);
      const saved = calculateCarbonFootprint('car', distanceKm) - carbonFootprint;
      ecoPoints = calculateEcoPoints(transportMode, saved);
    } else if (category === 'waste') {
      carbonFootprint = value * 0.5; // simplified
      ecoPoints = value * 2;
    } else {
      ecoPoints = Math.floor(value);
    }

    const result = await db.query(
      `INSERT INTO sustainability_metrics (stadium_id, event_id, user_id, category, metric_name, value, unit, carbon_footprint_kg, eco_points, transport_mode, distance_km, waste_type, energy_source, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [stadiumId, eventId, userId, category, metricName, value, unit, carbonFootprint, ecoPoints, transportMode, distanceKm, wasteType, energySource, metadata ? JSON.stringify(metadata) : '{}']
    );

    logger.info('Sustainability metric logged', { id: result.rows[0].id, category, points: ecoPoints });
    return result.rows[0];
  }

  async getMetrics(filters = {}) {
    let query = `SELECT sm.*, s.name as stadium_name, u.first_name, u.last_name FROM sustainability_metrics sm 
                 JOIN stadiums s ON s.id = sm.stadium_id LEFT JOIN users u ON u.id = sm.user_id WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (filters.stadiumId) { query += ` AND sm.stadium_id = $${idx}`; params.push(filters.stadiumId); idx++; }
    if (filters.eventId) { query += ` AND sm.event_id = $${idx}`; params.push(filters.eventId); idx++; }
    if (filters.userId) { query += ` AND sm.user_id = $${idx}`; params.push(filters.userId); idx++; }
    if (filters.category) { query += ` AND sm.category = $${idx}`; params.push(filters.category); idx++; }
    query += ` ORDER BY sm.timestamp DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(filters.limit || 50, filters.offset || 0);
    const result = await db.query(query, params);
    return result.rows;
  }

  async getUserEcoStats(userId) {
    const result = await db.query(
      `SELECT SUM(eco_points) as total_points, SUM(carbon_footprint_kg) as total_carbon,
              SUM(distance_km) as total_distance, COUNT(*) as total_actions,
              SUM(CASE WHEN category='transport' THEN 1 ELSE 0 END) as transport_count
       FROM sustainability_metrics WHERE user_id = $1`,
      [userId]
    );
    const byCategory = await db.query(
      `SELECT category, SUM(eco_points) as points, SUM(carbon_footprint_kg) as carbon FROM sustainability_metrics WHERE user_id = $1 GROUP BY category`,
      [userId]
    );
    return { totals: result.rows[0], byCategory: byCategory.rows };
  }

  async getLeaderboard(stadiumId, limit = 10, period = 'all') {
    let dateFilter = '';
    if (period === 'week') dateFilter = "AND timestamp > NOW() - INTERVAL '7 days'";
    if (period === 'month') dateFilter = "AND timestamp > NOW() - INTERVAL '30 days'";
    if (period === 'event' && stadiumId) {
      // Could filter by latest event
    }

    const query = `
      SELECT u.id, u.first_name, u.last_name, u.email,
             SUM(sm.eco_points) as total_points,
             SUM(sm.carbon_footprint_kg) as total_carbon,
             COUNT(*) as actions
      FROM sustainability_metrics sm
      JOIN users u ON u.id = sm.user_id
      WHERE sm.stadium_id = $1 ${dateFilter}
      GROUP BY u.id
      ORDER BY total_points DESC
      LIMIT $2
    `;
    const result = await db.query(query, [stadiumId, limit]);
    return result.rows.map((row, index) => ({ rank: index+1, ...row }));
  }

  async getCarbonReport(stadiumId, eventId = null) {
    const filter = eventId ? 'event_id = $2' : 'stadium_id = $1';
    const params = eventId ? [stadiumId, eventId] : [stadiumId];

    const result = await db.query(
      `SELECT category, SUM(value) as total_value, SUM(carbon_footprint_kg) as total_carbon, AVG(carbon_footprint_kg) as avg_carbon FROM sustainability_metrics WHERE ${filter} GROUP BY category`,
      params
    );

    const total = result.rows.reduce((sum, r) => sum + parseFloat(r.total_carbon || 0), 0);
    const benchmark = 5000; // kg benchmark for event
    const savings = Math.max(0, benchmark - total);

    return {
      totalCarbon: total,
      benchmark,
      savings,
      savingsPercent: benchmark > 0 ? (savings / benchmark * 100).toFixed(2) : 0,
      breakdown: result.rows,
      equivalent: {
        trees: Math.floor(savings / 21), // kg CO2 absorbed per tree per year approx
        carKm: Math.floor(savings / 0.12),
      }
    };
  }

  async getRewards(userId) {
    const stats = await this.getUserEcoStats(userId);
    const points = parseInt(stats.totals.total_points || 0, 10);
    const rewards = [
      { id: 1, name: 'Eco Fan Badge', points: 100, description: 'First sustainability action' },
      { id: 2, name: 'Green Commuter', points: 500, description: '5 eco-friendly transports' },
      { id: 3, name: 'Carbon Saver', points: 1000, description: 'Saved 100kg CO2' },
      { id: 4, name: 'World Cup Eco Champion', points: 5000, description: 'Top 10 on leaderboard' },
      { id: 5, name: 'Platinum Sustainability', points: 10000, description: 'Ultimate eco warrior' },
    ];
    return rewards.map(r => ({ ...r, unlocked: points >= r.points, progress: Math.min(100, Math.floor(points / r.points * 100)) }));
  }

  async calculateTransportFootprint(transportMode, distanceKm, passengers = 1) {
    const carbon = calculateCarbonFootprint(transportMode, distanceKm, passengers);
    const carCarbon = calculateCarbonFootprint('car', distanceKm, passengers);
    const saved = carCarbon - carbon;
    const points = calculateEcoPoints(transportMode, saved);
    return {
      transportMode,
      distanceKm,
      carbonFootprint: Math.round(carbon * 100)/100,
      carEquivalent: Math.round(carCarbon * 100)/100,
      carbonSaved: Math.round(saved * 100)/100,
      ecoPoints: points,
    };
  }
}

module.exports = new SustainabilityService();
