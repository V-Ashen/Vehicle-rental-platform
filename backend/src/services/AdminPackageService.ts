import { PackageRepository } from '../repositories/PackageRepository';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { AppError } from '../utils/AppError';

const packageRepo = new PackageRepository();

export class AdminPackageService {
  async createPackage(data: any, adminId: string) {
    const id = generateId(IdPrefix.PACKAGE);
    return await packageRepo.create(id, {
      ...data,
      status: 'DRAFT',
      createdBy: adminId,
      updatedBy: adminId
    });
  }

  async listPackages(limit: number = 20, cursor?: string) {
    return await packageRepo.findAllPaginated(limit, cursor, 'createdAt', 'desc');
  }

  async updatePackage(id: string, data: any, adminId: string) {
    const updated = await packageRepo.update(id, {
      ...data,
      updatedBy: adminId
    });
    
    if (!updated) {
      throw new AppError('Package not found', 'NOT_FOUND', 404);
    }
    
    return updated;
  }

  async updateStatus(id: string, status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED', adminId: string) {
    return this.updatePackage(id, { status }, adminId);
  }
}
