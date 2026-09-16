import { TenantRepository } from '../repositories/TenantRepository';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { AppError } from '../utils/AppError';

const tenantRepo = new TenantRepository();
const subRepo = new SubscriptionRepository();

export class AdminTenantService {
  async listTenants(limit: number = 20, cursor?: string, accountStatus?: string, profileStatus?: string) {
    const filters: any[] = [];
    if (accountStatus) {
      filters.push({ field: 'accountStatus', operator: '==', value: accountStatus });
    }
    if (profileStatus) {
      filters.push({ field: 'profileStatus', operator: '==', value: profileStatus });
    }

    const { data, nextCursor } = await tenantRepo.findAllPaginated(limit, cursor, 'createdAt', 'desc', filters);
    const totalCount = await tenantRepo.count(filters);

    return {
      tenants: data,
      pagination: {
        nextCursor,
        totalCount
      }
    };
  }

  async getTenant(id: string) {
    const tenant = await tenantRepo.findById(id, id);
    if (!tenant) {
      throw new AppError('Tenant not found', 'NOT_FOUND', 404);
    }
    
    // Get their subscriptions
    const subscriptions = await subRepo.findByQuery('tenantId', '==', id, id);
    
    return {
      ...tenant,
      subscriptions
    };
  }

  async updateProfileStatus(id: string, status: any, adminId: string) {
    const updated = await tenantRepo.update(id, { profileStatus: status, updatedBy: adminId }, id);
    if (!updated) {
      throw new AppError('Tenant not found', 'NOT_FOUND', 404);
    }
    return updated;
  }

  async updateAccountStatus(id: string, status: any, adminId: string) {
    const updated = await tenantRepo.update(id, { accountStatus: status, updatedBy: adminId }, id);
    if (!updated) {
      throw new AppError('Tenant not found', 'NOT_FOUND', 404);
    }
    // Business Rule (Page 146): Suspension removes operational portal access but retains billing access.
    // In our architecture, the `accountStatus` check in AuthMiddleware / AuthService will handle blocking operations
    // while we allow billing routes specifically if needed.
    return updated;
  }
}
