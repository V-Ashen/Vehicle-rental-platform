import { Request, Response } from 'express';
import { VehicleDocumentService } from '../services/VehicleDocumentService';

const docService = new VehicleDocumentService();

export class VehicleDocumentController {
  async create(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const { vehicleId } = req.params;
    const result = await docService.createDocument(tenantId, vehicleId as string, req.body, userId);
    res.status(201).json({ success: true, data: result });
  }

  async list(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const limit = parseInt(req.query.limit as string) || 25;
    const startAfterId = req.query.startAfter as string;
    const { vehicleId } = req.params;
    
    const result = await docService.getDocuments(tenantId, vehicleId as string, limit, startAfterId);
    res.status(200).json({ success: true, ...result });
  }
}
