import { AdminPackageService } from '../../services/AdminPackageService';
import { PackageRepository } from '../../repositories/PackageRepository';

jest.mock('../../config/firebase', () => ({
  db: { collection: jest.fn() },
  auth: {}
}));

jest.mock('../../repositories/PackageRepository');

describe('AdminPackageService', () => {
  let service: AdminPackageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminPackageService();
  });

  describe('createPackage', () => {
    it('should create a package with DRAFT status', async () => {
      jest.spyOn(PackageRepository.prototype, 'create').mockResolvedValue({
        id: 'PKG-1',
        name: 'Test',
        status: 'DRAFT'
      } as any);

      const result = await service.createPackage({ name: 'Test' }, 'ADMIN-1');
      expect(PackageRepository.prototype.create).toHaveBeenCalled();
      expect(result.status).toBe('DRAFT');
    });
  });
});
