import { Request, Response } from 'express';
import { VehicleService } from '../services/VehicleService';

const vehicleService = new VehicleService();

export class VehicleController {
  async create(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const result = await vehicleService.createVehicle(tenantId, req.body, userId);
    res.status(201).json({ success: true, data: result });
  }

  async list(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const limit = parseInt(req.query.limit as string) || 25;
    const startAfterId = req.query.startAfter as string;
    const status = req.query.status as string;
    
    const result = await vehicleService.getVehicles(tenantId, limit, startAfterId, status);
    res.status(200).json({ success: true, ...result });
  }

  async get(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const { id } = req.params;
    const result = await vehicleService.getVehicle(id as string, tenantId);
    res.status(200).json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const { id } = req.params;
    const result = await vehicleService.updateVehicle(id as string, tenantId, req.body, userId);
    res.status(200).json({ success: true, data: result });
  }
}
