const authService = require('../../src/services/authService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock db
jest.mock('../../src/utils/db', () => ({
  query: jest.fn(),
}));

const db = require('../../src/utils/db');

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const hash = await authService.hashPassword('Test123!@#');
      expect(hash).toBeDefined();
      expect(hash).not.toBe('Test123!@#');
      const valid = await bcrypt.compare('Test123!@#', hash);
      expect(valid).toBe(true);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await authService.hashPassword('SamePass123!');
      const hash2 = await authService.hashPassword('SamePass123!');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should compare password correctly', async () => {
      const hash = await bcrypt.hash('Test123!', 10);
      const valid = await authService.comparePassword('Test123!', hash);
      expect(valid).toBe(true);
      const invalid = await authService.comparePassword('Wrong!', hash);
      expect(invalid).toBe(false);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const user = { id: 'user-123', email: 'test@example.com', role: 'admin' };
      const tokens = authService.generateTokens(user);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      const decoded = jwt.decode(tokens.accessToken);
      expect(decoded.userId).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should include stadiumId if present', () => {
      const user = { id: '1', email: 'a@b.com', role: 'staff', stadium_id: 'stad-1' };
      const tokens = authService.generateTokens(user);
      const decoded = jwt.decode(tokens.accessToken);
      expect(decoded.stadiumId).toBe('stad-1');
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // existing check
      db.query.mockResolvedValueOnce({ rows: [{ id: 'new-id', email: 'new@test.com', role: 'staff' }] }); // insert

      const user = await authService.register({
        email: 'new@test.com', password: 'Test123!@#', firstName: 'John', lastName: 'Doe', role: 'staff',
      });
      expect(user.email).toBe('new@test.com');
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should throw if user exists', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'existing' }] });
      await expect(authService.register({ email: 'existing@test.com', password: 'Test123!', firstName: 'A', lastName: 'B' })).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const hash = await bcrypt.hash('Valid123!@#', 10);
      db.query.mockResolvedValueOnce({ rows: [{ id: '1', email: 'test@test.com', password_hash: hash, first_name: 'Test', last_name: 'User', role: 'admin', is_active: true }] });
      db.query.mockResolvedValueOnce({ rows: [] }); // update last_login
      const result = await authService.login('test@test.com', 'Valid123!@#');
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
    });

    it('should fail with invalid email', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      await expect(authService.login('invalid@test.com', 'pass')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should fail with wrong password', async () => {
      const hash = await bcrypt.hash('Correct123!', 10);
      db.query.mockResolvedValueOnce({ rows: [{ id: '1', email: 'test@test.com', password_hash: hash, is_active: true }] });
      await expect(authService.login('test@test.com', 'Wrong123!')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should fail if account deactivated', async () => {
      const hash = await bcrypt.hash('Test123!', 10);
      db.query.mockResolvedValueOnce({ rows: [{ id: '1', email: 'test@test.com', password_hash: hash, is_active: false }] });
      await expect(authService.login('test@test.com', 'Test123!')).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
