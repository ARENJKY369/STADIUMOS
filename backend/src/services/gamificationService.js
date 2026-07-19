/**
 * Gamification Service - Sustainability & Engagement
 * Eco-points, leaderboards, badges, rewards, referral tracking
 */
const db = require('../utils/db');
const logger = require('../utils/logger');

class GamificationService {
  constructor() {
    this.badges = [
      { id: 'eco_fan', name: 'Eco Fan', description: 'First sustainability action', points: 100, icon: '🌱', category: 'starter' },
      { id: 'green_commuter', name: 'Green Commuter', description: '5 eco-friendly transports', points: 500, icon: '🚌', category: 'transport' },
      { id: 'carbon_saver', name: 'Carbon Saver', description: 'Saved 100kg CO2', points: 1000, icon: '🌍', category: 'impact' },
      { id: 'tree_saver', name: 'Tree Saver', description: 'Equivalent to planting 5 trees', points: 1000, icon: '🌳', category: 'impact' },
      { id: 'community_leader', name: 'Community Leader', description: 'Top 10 leaderboard', points: 0, icon: '👑', category: 'leaderboard', special: true },
      { id: 'streak_7', name: '7-Day Green Streak', description: '7 consecutive green days', points: 700, icon: '🔥', category: 'streak' },
      { id: 'world_cup_champion', name: 'World Cup Eco Champion', description: 'Top 10 all-time', points: 5000, icon: '🏆', category: 'elite' },
      { id: 'ambassador', name: 'Sustainability Ambassador', description: '50+ referrals', points: 10000, icon: '🎖️', category: 'social' },
    ];

    this.rewards = [
      { id: 'discount_10', name: '10% Merchandise Discount', points: 200, category: 'discount', inventory: 1000, expiryDays: 30 },
      { id: 'discount_20', name: '20% Merchandise Discount', points: 500, category: 'discount', inventory: 500, expiryDays: 30 },
      { id: 'discount_30', name: '30% Merchandise Discount', points: 1000, category: 'discount', inventory: 100, expiryDays: 30 },
      { id: 'free_drink', name: 'Free Drink Voucher', points: 150, category: 'food', inventory: 2000, expiryDays: 7 },
      { id: 'vip_upgrade', name: 'VIP Seating Upgrade', points: 2000, category: 'experience', inventory: 50, expiryDays: 60 },
      { id: 'exclusive_access', name: 'Exclusive Event Access', points: 5000, category: 'experience', inventory: 10, expiryDays: 90 },
      { id: 'tree_planted', name: 'Tree Planted in Your Name', points: 300, category: 'charity', inventory: -1, expiryDays: 365 },
      { id: 'carbon_credit', name: 'Carbon Offset Credit 50kg', points: 400, category: 'charity', inventory: -1, expiryDays: 365 },
    ];
  }

  async calculatePoints(userId, stadiumId = null) {
    const result = await db.query(
      `SELECT SUM(eco_points) as total_points, SUM(carbon_footprint_kg) as total_carbon, COUNT(*) as total_actions, COUNT(DISTINCT DATE(timestamp)) as active_days FROM sustainability_metrics WHERE user_id = $1 ${stadiumId ? 'AND stadium_id = $2' : ''}`,
      stadiumId ? [userId, stadiumId] : [userId]
    );
    return result.rows[0];
  }

  async getUserBadges(userId) {
    const stats = await this.calculatePoints(userId);
    const totalPoints = parseInt(stats.total_points || 0, 10);
    const totalCarbon = parseFloat(stats.total_carbon || 0);
    const activeDays = parseInt(stats.active_days || 0, 10);
    const actions = parseInt(stats.total_actions || 0, 10);

    // Check leaderboard for community_leader badge
    let isTop10 = false;
    try {
      const leaderboard = await db.query(
        `SELECT user_id FROM sustainability_metrics GROUP BY user_id ORDER BY SUM(eco_points) DESC LIMIT 10`
      );
      isTop10 = leaderboard.rows.some(r => r.user_id === userId);
    } catch {}

    const userBadges = this.badges.map(badge => {
      let unlocked = false;
      let progress = 0;

      switch(badge.id) {
        case 'eco_fan':
          unlocked = actions >= 1;
          progress = Math.min(100, actions * 100);
          break;
        case 'green_commuter':
          unlocked = actions >= 5;
          progress = Math.min(100, (actions / 5) * 100);
          break;
        case 'carbon_saver':
          unlocked = totalCarbon >= 100;
          progress = Math.min(100, (totalCarbon / 100) * 100);
          break;
        case 'tree_saver':
          unlocked = totalCarbon >= 105; // 5 trees * 21kg
          progress = Math.min(100, (totalCarbon / 105) * 100);
          break;
        case 'community_leader':
          unlocked = isTop10;
          progress = isTop10 ? 100 : 0;
          break;
        case 'streak_7':
          unlocked = activeDays >= 7;
          progress = Math.min(100, (activeDays / 7) * 100);
          break;
        case 'world_cup_champion':
          unlocked = totalPoints >= 5000;
          progress = Math.min(100, (totalPoints / 5000) * 100);
          break;
        case 'ambassador':
          unlocked = totalPoints >= 10000;
          progress = Math.min(100, (totalPoints / 10000) * 100);
          break;
      }

      return { ...badge, unlocked, progress, unlockedAt: unlocked ? new Date().toISOString() : null };
    });

    return userBadges;
  }

  async getLeaderboard(stadiumId, limit = 10, period = 'all', category = null) {
    let dateFilter = '';
    if (period === 'today') dateFilter = `AND sm.timestamp > CURRENT_DATE`;
    else if (period === 'week') dateFilter = `AND sm.timestamp > NOW() - INTERVAL '7 days'`;
    else if (period === 'month') dateFilter = `AND sm.timestamp > NOW() - INTERVAL '30 days'`;

    let categoryFilter = '';
    if (category) categoryFilter = `AND sm.category = '${category}'`;

    const query = `
      SELECT u.id, u.first_name, u.last_name, u.email,
             SUM(sm.eco_points) as total_points,
             SUM(sm.carbon_footprint_kg) as total_carbon,
             COUNT(*) as total_actions,
             COUNT(DISTINCT DATE(sm.timestamp)) as active_days,
             MAX(sm.timestamp) as last_action
      FROM sustainability_metrics sm
      JOIN users u ON u.id = sm.user_id
      WHERE sm.stadium_id = $1 ${dateFilter} ${categoryFilter}
      GROUP BY u.id
      ORDER BY total_points DESC
      LIMIT $2
    `;

    const result = await db.query(query, [stadiumId, limit]);
    return result.rows.map((row, idx) => ({
      rank: idx + 1,
      ...row,
      total_points: parseInt(row.total_points,10),
      badge: this.getRankBadge(idx + 1)
    }));
  }

  getRankBadge(rank) {
    if (rank === 1) return { icon: '🥇', label: 'Gold Champion', color: 'gold' };
    if (rank === 2) return { icon: '🥈', label: 'Silver Medalist', color: 'silver' };
    if (rank === 3) return { icon: '🥉', label: 'Bronze Medalist', color: 'bronze' };
    if (rank <= 10) return { icon: '🏅', label: 'Top 10', color: 'blue' };
    if (rank <= 100) return { icon: '⭐', label: 'Top 100', color: 'purple' };
    return { icon: '🌱', label: 'Eco Fan', color: 'green' };
  }

  async getRewards(userId = null) {
    const userPoints = userId ? (await this.calculatePoints(userId)).total_points || 0 : 0;
    
    return this.rewards.map(reward => ({
      ...reward,
      affordable: parseInt(userPoints,10) >= reward.points,
      progress: Math.min(100, Math.floor((parseInt(userPoints,10) / reward.points) * 100)),
      available: reward.inventory === -1 || reward.inventory > 0,
    }));
  }

  async redeemReward(userId, rewardId) {
    const reward = this.rewards.find(r => r.id === rewardId);
    if (!reward) throw { statusCode: 404, message: 'Reward not found' };

    const stats = await this.calculatePoints(userId);
    const totalPoints = parseInt(stats.total_points || 0, 10);

    if (totalPoints < reward.points) {
      throw { statusCode: 400, message: `Insufficient points. Need ${reward.points}, have ${totalPoints}` };
    }

    if (reward.inventory !== -1 && reward.inventory <= 0) {
      throw { statusCode: 400, message: 'Reward out of stock' };
    }

    // Log redemption as negative points? Or separate table - for simplicity, create sustainability metric with negative points
    const redemptionCode = `RDM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;
    
    // In production, would have separate redemptions table
    try {
      await db.query(
        `INSERT INTO sustainability_metrics (user_id, stadium_id, category, metric_name, value, unit, eco_points, metadata)
         VALUES ($1, $2, 'reward', $3, $4, 'points', $5, $6)`,
        [userId, null, `Reward redemption: ${reward.name}`, -reward.points, -reward.points, JSON.stringify({ rewardId, redemptionCode, points: reward.points })]
      );
    } catch (e) {
      logger.warn('Failed to log redemption', { error: e.message });
    }

    // Decrease inventory (if not unlimited)
    if (reward.inventory !== -1) {
      reward.inventory--;
    }

    logger.info('Reward redeemed', { userId, rewardId, redemptionCode, points: reward.points });

    return {
      success: true,
      redemptionCode,
      reward,
      remainingPoints: totalPoints - reward.points,
      expiresAt: new Date(Date.now() + reward.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
      qrCode: `https://stadiumops.fifa2026.com/redeem/${redemptionCode}`,
    };
  }

  async getUserProgress(userId, stadiumId = null) {
    const stats = await this.calculatePoints(userId, stadiumId);
    const badges = await this.getUserBadges(userId);
    const unlockedBadges = badges.filter(b => b.unlocked);
    const nextBadge = badges.filter(b => !b.unlocked).sort((a,b) => a.points - b.points)[0] || null;

    // Calculate streak
    const streakRes = await db.query(
      `SELECT DATE(timestamp) as date, COUNT(*) as actions FROM sustainability_metrics WHERE user_id = $1 GROUP BY DATE(timestamp) ORDER BY date DESC LIMIT 30`,
      [userId]
    );
    
    // Simplified streak: consecutive days with actions
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < streakRes.rows.length; i++) {
      const date = new Date(streakRes.rows[i].date);
      const diffDays = Math.floor((today - date) / (24*60*60*1000));
      if (diffDays === i) streak++;
      else break;
    }

    return {
      totalPoints: parseInt(stats.total_points || 0, 10),
      totalCarbon: parseFloat(stats.total_carbon || 0),
      totalActions: parseInt(stats.total_actions || 0, 10),
      activeDays: parseInt(stats.active_days || 0, 10),
      currentStreak: streak,
      badges: {
        total: badges.length,
        unlocked: unlockedBadges.length,
        unlockedList: unlockedBadges,
        nextBadge
      },
      leaderboard: {
        // Would fetch rank from leaderboard query
        estimatedRank: 'Calculating...'
      }
    };
  }
}

module.exports = new GamificationService();
