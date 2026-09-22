import { Request, Response } from 'express';
import { RentalService } from '../services/RentalService';

const rentalService = new RentalService();

export class RentalController {
  async getAll(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const result = await rentalService.getAllRentals(tenantId);
    res.status(200).json({ success: true, data: result });
  }

  async getById(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const id = req.params.id as string;
    const result = await rentalService.getRentalById(id, tenantId);
    res.status(200).json({ success: true, data: result });
  }

  async create(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const result = await rentalService.createRental(tenantId, req.body, userId);
    res.status(201).json({ success: true, data: result });
  }

  async handover(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const { id } = req.params;
    const result = await rentalService.handover(id as string, tenantId, req.body, userId);
    res.status(200).json({ success: true, data: result });
  }

  async returnRental(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const { id } = req.params;
    const result = await rentalService.returnRental(id as string, tenantId, req.body, userId);
    res.status(200).json({ success: true, data: result });
  }
}
