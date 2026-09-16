import { Request, Response } from 'express';
import { OwnerUploadService } from '../services/OwnerUploadService';

const uploadService = new OwnerUploadService();

export class OwnerUploadController {
  async generateSignedUrl(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    const { fileName, contentType, fileCategory } = req.body;

    const result = await uploadService.generateSignedUrl(tenantId, fileName, contentType, fileCategory);
    res.status(200).json({ success: true, data: result });
  }
}
