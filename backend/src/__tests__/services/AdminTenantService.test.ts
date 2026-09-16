import { AdminTenantService } from '../../services/AdminTenantService';
import { TenantRepository } from '../../repositories/TenantRepository';
import { SubscriptionRepository } from '../../repositories/SubscriptionRepository';

jest.mock('../../config/firebase', () => ({
  db: { collection: jest.fn() },
  auth: {}
}));

jest.mock('../../repositories/TenantRepository');
jest.mock('../../repositories/SubscriptionRepository');

describe('AdminTenantService', () => {
  let service: AdminTenantService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminTenantService();
  });

  describe('updateAccountStatus', () => {
    it('should successfully update tenant account status', async () => {
      jest.spyOn(TenantRepository.prototype, 'update').mockResolvedValue({
        id: 'TEN-123',
        accountStatus: 'SUSPENDED'
      } as any);

      const result = await service.updateAccountStatus('TEN-123', 'SUSPENDED', 'ADMIN-1');
      expect(TenantRepository.prototype.update).toHaveBeenCalledWith('TEN-123', { accountStatus: 'SUSPENDED', updatedBy: 'ADMIN-1' }, 'TEN-123');
      expect(result.accountStatus).toBe('SUSPENDED');
    });
  });
});
