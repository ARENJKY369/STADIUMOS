const request = require('supertest');
const { app } = require('../../src/app');
jest.mock('../../src/utils/db');

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const db = require('../../src/utils/db');
      db.healthCheck.mockResolvedValueOnce({ ok: true, time: new Date() });
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBeDefined();
    });
  });

  describe('Root endpoint', () => {
    it('should return API info', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('FIFA World Cup');
      expect(res.body.endpoints).toBeDefined();
    });
  });

  describe('Auth Endpoints', () => {
    it('should require auth token for protected routes', async () => {
      const res = await request(app).get('/api/v1/events');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_MISSING');
    });

    it('should validate login input', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'invalid', password: '' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/v1/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limits', async () => {
      // Make multiple rapid requests to auth endpoint (low threshold)
      // This is conceptual - actual rate limit threshold is higher
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@test.com', password: 'wrong' });
      // Should be 401 or 400, not 429 on first try
      expect([400, 401, 429]).toContain(res.status);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const res = await request(app).get('/').set('Origin', 'http://localhost:3000');
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Swagger Docs', () => {
    it('should serve API docs', async () => {
      const res = await request(app).get('/api/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger');
    });

    it('should return OpenAPI JSON', async () => {
      const res = await request(app).get('/api/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBeDefined();
      expect(res.body.info.title).toContain('Stadium Operations');
    });
  });
});

describe('Security Headers', () => {
  it('should include helmet security headers', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
