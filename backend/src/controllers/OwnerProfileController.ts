import { Request, Response } from 'express';
import { OwnerProfileService } from '../services/OwnerProfileService';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { PackageRepository } from '../repositories/PackageRepository';
import { AppError } from '../utils/AppError';

const profileService = new OwnerProfileService();
const subRepo = new SubscriptionRepository();
const packageRepo = new PackageRepository();

export class OwnerProfileController {
  async get(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    const result = await profileService.getProfile(tenantId);
    res.status(200).json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    const userId = (req as any).ownerUser.id;
    // req.body has fields from updateOwnerProfileSchema
    // In db, phone is mapped from mobile, but let's just use what was sent or map it
    const updateData = { ...req.body };
    if (updateData.mobile) {
      updateData.phone = updateData.mobile;
      delete updateData.mobile;
    }

    if (updateData.smsEnabled === true) {
      const subs = await subRepo.findByQuery('tenantId', '==', tenantId);
      const activeSub = subs.find(s => s.status === 'ACTIVE' || s.status === 'TRIAL');
      if (activeSub && activeSub.packageId) {
        const pkg = await packageRepo.findById(activeSub.packageId);
        if (!pkg || (!pkg.features?.smsNotifications && !pkg.features?.allFeatures)) {
          throw new AppError('Please upgrade your package to enable SMS.', 'FORBIDDEN', 403);
        }
      } else {
        throw new AppError('No active subscription found.', 'FORBIDDEN', 403);
      }
    }

    const result = await profileService.updateProfile(tenantId, updateData, userId);
    res.status(200).json({ success: true, data: result });
  }

  async submit(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    const userId = (req as any).ownerUser.id;
    const result = await profileService.submitProfile(tenantId, userId);
    res.status(200).json({ success: true, data: result });
  }
}
