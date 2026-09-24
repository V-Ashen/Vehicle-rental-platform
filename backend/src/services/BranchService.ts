import { BranchRepository } from '../repositories/BranchRepository';
import { PackageRepository } from '../repositories/PackageRepository';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { AppError } from '../utils/AppError';
import { AuditLogService } from './AuditLogService';

const branchRepo = new BranchRepository();
const packageRepo = new PackageRepository();
const auditService = new AuditLogService();

export class BranchService {
  async listBranches(tenantId: string) {
    return await branchRepo.findByTenantId(tenantId);
  }

  async createBranch(tenantId: string, userId: string, activeSubscription: any, data: any) {
    // 1. Check Package Limits
    const pkg = await packageRepo.findById(activeSubscription.packageId);
    if (!pkg) throw new AppError('Associated package not found', 'INTERNAL_SERVER_ERROR', 500);

    const currentCount = await branchRepo.countByTenantId(tenantId);
    if (currentCount >= pkg.maxBranches) {
      throw new AppError(`Branch limit reached for ${pkg.name} package. Maximum allowed is ${pkg.maxBranches}.`, 'LIMIT_EXCEEDED', 400);
    }

    const branchId = generateId(IdPrefix.BRANCH);
    const now = new Date();

    const branchData = {
      tenantId,
      name: data.name,
      address: data.address,
      city: data.city,
      phone: data.phone,
      status: 'ACTIVE' as const,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId
    };

    await branchRepo.create(branchId, branchData);

    await auditService.logAction(
      tenantId,
      userId,
      'BRANCH_CREATED',
      'SETTINGS',
      branchId,
      undefined,
      branchData
    );

    return { id: branchId, ...branchData };
  }

  async updateBranch(tenantId: string, userId: string, id: string, data: any) {
    const branch = await branchRepo.findById(id);
    if (!branch) throw new AppError('Branch not found', 'NOT_FOUND', 404);
    if (branch.tenantId !== tenantId) throw new AppError('Unauthorized', 'FORBIDDEN', 403);

    const updatedData = {
      ...data,
      updatedAt: new Date(),
      updatedBy: userId
    };

    await branchRepo.update(id, updatedData);

    await auditService.logAction(
      tenantId,
      userId,
      'BRANCH_UPDATED',
      'SETTINGS',
      id,
      branch,
      updatedData
    );

    return { ...branch, ...updatedData };
  }

  async deleteBranch(tenantId: string, userId: string, id: string) {
    const branch = await branchRepo.findById(id);
    if (!branch) throw new AppError('Branch not found', 'NOT_FOUND', 404);
    if (branch.tenantId !== tenantId) throw new AppError('Unauthorized', 'FORBIDDEN', 403);

    await branchRepo.delete(id);

    await auditService.logAction(
      tenantId,
      userId,
      'BRANCH_DELETED',
      'SETTINGS',
      id,
      branch,
      undefined
    );

    return { id };
  }
}
