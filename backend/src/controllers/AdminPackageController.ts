import { Request, Response } from 'express';
import { AdminPackageService } from '../services/AdminPackageService';

const packageService = new AdminPackageService();

export class AdminPackageController {
  async create(req: Request, res: Response) {
    const adminId = (req as any).adminUser.id;
    const result = await packageService.createPackage(req.body, adminId);
    res.status(201).json({ success: true, data: result });
  }

  async list(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;
    const result = await packageService.listPackages(limit, cursor);
    res.status(200).json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const adminId = (req as any).adminUser.id;
    const { id } = req.params;
    const result = await packageService.updatePackage(id as string, req.body, adminId);
    res.status(200).json({ success: true, data: result });
  }

  async updateStatus(req: Request, res: Response) {
    const adminId = (req as any).adminUser.id;
    const { id } = req.params;
    const { status } = req.body;
    const result = await packageService.updateStatus(id as string, status, adminId);
    res.status(200).json({ success: true, data: result });
  }
}
