import { AuthService } from '../../services/AuthService';
import { AppError } from '../../utils/AppError';
import { auth } from '../../config/firebase';

// Mock dependencies
jest.mock('../../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
  db: {
    collection: jest.fn(),
  }
}));

jest.mock('../../repositories/TenantRepository');
jest.mock('../../repositories/UserRepository');
jest.mock('../../repositories/RoleRepository');
jest.mock('../../repositories/SubscriptionRepository');
jest.mock('../../repositories/PackageRepository');

// Import the mocked classes to provide mock implementations
import { TenantRepository } from '../../repositories/TenantRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { PackageRepository } from '../../repositories/PackageRepository';
import { RoleRepository } from '../../repositories/RoleRepository';
import { SubscriptionRepository } from '../../repositories/SubscriptionRepository';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    it('should successfully register a new tenant and user', async () => {
      // Setup mocks
      const mockVerifyIdToken = auth.verifyIdToken as jest.Mock;
      mockVerifyIdToken.mockResolvedValue({ uid: 'firebase_uid_123', email: 'test@example.com' });

      const mockFindByFirebaseUid = jest.spyOn(UserRepository.prototype, 'findByFirebaseUid').mockResolvedValue(null);
      const mockUserCreate = jest.spyOn(UserRepository.prototype, 'create').mockResolvedValue({ id: 'USR-123', name: 'Test', email: 'test@example.com', roleId: 'ROL-123', userType: 'OWNER', tenantId: 'TEN-123' } as any);

      const mockFindByName = jest.spyOn(PackageRepository.prototype, 'findByName').mockResolvedValue({ id: 'PKG-123', name: 'Starter', trialDays: 14 } as any);

      const mockTenantCreate = jest.spyOn(TenantRepository.prototype, 'create').mockResolvedValue({ id: 'TEN-123' } as any);
      const mockRoleCreate = jest.spyOn(RoleRepository.prototype, 'create').mockResolvedValue({ id: 'ROL-123' } as any);
      const mockSubCreate = jest.spyOn(SubscriptionRepository.prototype, 'create').mockResolvedValue({ id: 'SUB-123' } as any);

      const result = await authService.register('valid_token', 'My Biz', 'Test User', 'test@example.com', '12345678', '123 Street', 'City');

      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid_token');
      expect(mockFindByFirebaseUid).toHaveBeenCalledWith('firebase_uid_123');
      expect(mockFindByName).toHaveBeenCalledWith('Starter');
      
      expect(mockTenantCreate).toHaveBeenCalled();
      expect(mockUserCreate).toHaveBeenCalled();
      expect(mockRoleCreate).toHaveBeenCalled();
      expect(mockSubCreate).toHaveBeenCalled();
      
      expect(result).toHaveProperty('tenantId');
      expect(result.user).toHaveProperty('email', 'test@example.com');
    });

    it('should throw an error if email does not match token', async () => {
      const mockVerifyIdToken = auth.verifyIdToken as jest.Mock;
      mockVerifyIdToken.mockResolvedValue({ uid: 'firebase_uid_123', email: 'different@example.com' });

      await expect(
        authService.register('token', 'Biz', 'Test', 'test@example.com', '123', 'addr', 'city')
      ).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('should successfully login and return user profile and subscription', async () => {
      const mockVerifyIdToken = auth.verifyIdToken as jest.Mock;
      mockVerifyIdToken.mockResolvedValue({ uid: 'firebase_uid_123' });

      const mockFindByFirebaseUid = jest.spyOn(UserRepository.prototype, 'findByFirebaseUid').mockResolvedValue({ id: 'USR-123', tenantId: 'TEN-123', status: 'ACTIVE' } as any);
      
      const mockFindById = jest.spyOn(TenantRepository.prototype, 'findById').mockResolvedValue({ id: 'TEN-123', accountStatus: 'ACTIVE' } as any);
      
      const mockFindByQuery = jest.spyOn(SubscriptionRepository.prototype, 'findByQuery').mockResolvedValue([{ id: 'SUB-123', status: 'ACTIVE' }] as any);

      const result = await authService.login('valid_token');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('subscription');
      expect(result.subscription?.status).toBe('ACTIVE');
    });

    it('should throw error if user account is disabled', async () => {
      const mockVerifyIdToken = auth.verifyIdToken as jest.Mock;
      mockVerifyIdToken.mockResolvedValue({ uid: 'firebase_uid_123' });

      jest.spyOn(UserRepository.prototype, 'findByFirebaseUid').mockResolvedValue({ id: 'USR-123', tenantId: 'TEN-123', status: 'DISABLED' } as any);

      await expect(authService.login('valid_token')).rejects.toThrow('User account is DISABLED');
    });
  });
});
