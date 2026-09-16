import { Request, Response } from 'express';
import { OwnerProfileService } from '../services/OwnerProfileService';

const profileService = new OwnerProfileService();

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
