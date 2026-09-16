import { Request, Response } from 'express';
import { AdminTenantService } from '../services/AdminTenantService';

const tenantService = new AdminTenantService();

export class AdminTenantController {
  async list(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;
    const accountStatus = req.query.accountStatus as string;
    const profileStatus = req.query.profileStatus as string;

    const result = await tenantService.listTenants(limit, cursor, accountStatus, profileStatus);
    res.status(200).json({ success: true, data: result });
  }

  async get(req: Request, res: Response) {
    const { id } = req.params;
    const result = await tenantService.getTenant(id as string);
    res.status(200).json({ success: true, data: result });
  }

  async updateProfileStatus(req: Request, res: Response) {
    const adminId = (req as any).adminUser.id;
    const { id } = req.params;
    const { status } = req.body;
    const result = await tenantService.updateProfileStatus(id as string, status, adminId);
    res.status(200).json({ success: true, data: result });
  }

  async updateAccountStatus(req: Request, res: Response) {
    const adminId = (req as any).adminUser.id;
    const { id } = req.params;
    const { status } = req.body;
    const result = await tenantService.updateAccountStatus(id as string, status, adminId);
    res.status(200).json({ success: true, data: result });
  }
}
