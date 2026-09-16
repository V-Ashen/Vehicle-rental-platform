import { TenantRepository } from '../repositories/TenantRepository';
import { AppError } from '../utils/AppError';

const tenantRepo = new TenantRepository();

export class OwnerProfileService {
  async getProfile(tenantId: string) {
    const tenant = await tenantRepo.findById(tenantId, tenantId);
    if (!tenant) throw new AppError('Tenant not found', 'NOT_FOUND', 404);
    return tenant;
  }

  async updateProfile(tenantId: string, data: any, userId: string) {
    const updated = await tenantRepo.update(tenantId, {
      ...data,
      updatedBy: userId
    }, tenantId);

    if (!updated) throw new AppError('Tenant not found', 'NOT_FOUND', 404);
    return updated;
  }

  async submitProfile(tenantId: string, userId: string) {
    const tenant = await tenantRepo.findById(tenantId, tenantId);
    if (!tenant) throw new AppError('Tenant not found', 'NOT_FOUND', 404);

    if (!tenant.ownerNic || !tenant.phone || !tenant.address || !tenant.city) {
      throw new AppError('Missing required fields. NIC, mobile, address, and city are mandatory.', 'VALIDATION_ERROR', 400);
    }

    if (tenant.profileStatus === 'VERIFIED') {
      throw new AppError('Profile is already verified', 'INVALID_STATE', 400);
    }

    const updated = await tenantRepo.update(tenantId, {
      profileStatus: 'PENDING',
      updatedBy: userId
    }, tenantId);

    return updated;
  }
}
