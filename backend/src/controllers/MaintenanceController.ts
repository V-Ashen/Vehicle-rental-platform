import { Request, Response } from 'express';
import { MaintenanceService } from '../services/MaintenanceService';

const maintenanceService = new MaintenanceService();

export class MaintenanceController {
  async create(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const result = await maintenanceService.createMaintenance(tenantId, req.body, userId);
    res.status(201).json({ success: true, data: result });
  }

  async list(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const limit = parseInt(req.query.limit as string) || 25;
    const startAfterId = req.query.startAfter as string;
    const vehicleId = req.query.vehicleId as string;
    
    const result = await maintenanceService.getMaintenanceRecords(tenantId, limit, startAfterId, vehicleId);
    res.status(200).json({ success: true, ...result });
  }

  async get(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const { id } = req.params;
    const result = await maintenanceService.getMaintenanceRecord(id as string, tenantId);
    res.status(200).json({ success: true, data: result });
  }
}
