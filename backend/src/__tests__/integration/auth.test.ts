import request from 'supertest';
import app from '../../app';
import { auth } from '../../config/firebase';
import { AuthService } from '../../services/AuthService';

jest.mock('../../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
  db: {
    collection: jest.fn(),
  }
}));

// Do not jest.mock the module so we can spy on its prototype
// jest.mock('../../services/AuthService');

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          businessName: 'Biz',
          name: 'Name',
          email: 'test@test.com',
          phone: '12345678',
          address: 'Street 1',
          city: 'City'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for validation errors', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', 'Bearer dummy_token')
        .send({
          businessName: 'B', // Too short
          name: 'Name',
          email: 'invalid-email', // Invalid email
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 201 on successful registration', async () => {
      jest.spyOn(AuthService.prototype, 'register').mockResolvedValue({
        tenantId: 'TEN-123',
        user: { id: 'USR-123', email: 'test@test.com', name: 'My Name', roleId: 'ROL', userType: 'OWNER' }
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', 'Bearer valid_token')
        .send({
          businessName: 'My Biz',
          name: 'My Name',
          email: 'test@test.com',
          phone: '12345678',
          address: 'Street 1',
          city: 'City'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenantId).toBe('TEN-123');
    });
  });
});
