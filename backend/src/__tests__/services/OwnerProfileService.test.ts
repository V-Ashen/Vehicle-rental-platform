import { OwnerProfileService } from '../../services/OwnerProfileService';
import { TenantRepository } from '../../repositories/TenantRepository';
import { AppError } from '../../utils/AppError';

jest.mock('../../config/firebase', () => ({
  db: { collection: jest.fn() },
  auth: {},
  storage: { bucket: jest.fn() }
}));
jest.mock('../../repositories/TenantRepository');

describe('OwnerProfileService', () => {
  let service: OwnerProfileService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OwnerProfileService();
  });

  describe('submitProfile', () => {
    it('should throw error if required fields are missing', async () => {
      // Mock tenant missing ownerNic
      jest.spyOn(TenantRepository.prototype, 'findById').mockResolvedValue({
        id: 'TEN-1',
        phone: '1234567890',
        address: '123 St',
        city: 'Colombo',
        profileStatus: 'INCOMPLETE'
      } as any);

      await expect(service.submitProfile('TEN-1', 'USER-1')).rejects.toThrow(AppError);
      await expect(service.submitProfile('TEN-1', 'USER-1')).rejects.toThrow('Missing required fields');
    });

    it('should successfully update status to PENDING if all fields exist', async () => {
      jest.spyOn(TenantRepository.prototype, 'findById').mockResolvedValue({
        id: 'TEN-1',
        ownerNic: '987654321V',
        phone: '1234567890',
        address: '123 St',
        city: 'Colombo',
        profileStatus: 'INCOMPLETE'
      } as any);

      jest.spyOn(TenantRepository.prototype, 'update').mockResolvedValue({
        profileStatus: 'PENDING'
      } as any);

      const result = await service.submitProfile('TEN-1', 'USER-1');
      expect(result!.profileStatus).toBe('PENDING');
      expect(TenantRepository.prototype.update).toHaveBeenCalledWith('TEN-1', expect.objectContaining({ profileStatus: 'PENDING' }), 'TEN-1');
    });
  });
});
