const crypto = require('crypto');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate pagination metadata
 */
function getPagination(page, limit, total) {
  const currentPage = parseInt(page, 10) || 1;
  const perPage = parseInt(limit, 10) || 20;
  const totalPages = Math.ceil(total / perPage);
  const offset = (currentPage - 1) * perPage;
  return {
    currentPage,
    perPage,
    total,
    totalPages,
    offset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

/**
 * Format response wrapper
 */
function successResponse(data, message = 'Success', pagination = null) {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  if (pagination) response.pagination = pagination;
  return response;
}

function errorResponse(message, errors = null, code = 'ERROR') {
  return {
    success: false,
    message,
    code,
    errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate secure random token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Calculate distance between two coordinates (haversine)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Generate ticket code
 */
function generateTicketCode(eventId, userId) {
  const prefix = eventId.substring(0, 4).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${random}-${timestamp}`;
}

/**
 * Validate & sanitize
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Calculate carbon footprint
 */
function calculateCarbonFootprint(transportMode, distanceKm, passengers = 1) {
  const emissionFactors = {
    car: 0.12, // kg CO2 per km
    bus: 0.05,
    train: 0.03,
    subway: 0.02,
    bicycle: 0,
    walking: 0,
    flight: 0.25,
    rideshare: 0.10,
  };
  const factor = emissionFactors[transportMode] || 0.12;
  return (distanceKm * factor) / passengers;
}

/**
 * Eco points calculation
 */
function calculateEcoPoints(transportMode, carbonSaved) {
  const basePoints = {
    walking: 100,
    bicycle: 80,
    bus: 50,
    train: 60,
    subway: 55,
    car: 10,
    rideshare: 20,
  };
  const base = basePoints[transportMode] || 10;
  const bonus = Math.floor(carbonSaved * 10);
  return base + bonus;
}

/**
 * Risk score calculation for crowd
 */
function calculateRiskScore(density, flowRate, occupancyPercent) {
  let score = 0;
  if (density > 80) score += 0.4;
  else if (density > 60) score += 0.2;
  if (flowRate > 100) score += 0.3;
  else if (flowRate > 50) score += 0.15;
  if (occupancyPercent > 90) score += 0.4;
  else if (occupancyPercent > 75) score += 0.2;
  return Math.min(score, 1.0);
}

/**
 * Response time formatting
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = (seconds % 60).toFixed(0);
  return `${minutes}m ${remaining}s`;
}

module.exports = {
  getPagination,
  successResponse,
  errorResponse,
  generateSecureToken,
  calculateDistance,
  generateTicketCode,
  sanitizeString,
  isValidEmail,
  calculateCarbonFootprint,
  calculateEcoPoints,
  calculateRiskScore,
  formatDuration,
  uuidv4,
  dayjs,
};
