import { Request, Response } from 'express';
import { BranchService } from '../services/BranchService';

const branchService = new BranchService();

export class BranchController {
  async list(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const branches = await branchService.listBranches(tenantId);
    res.status(200).json({ success: true, data: branches });
  }

  async create(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const activeSubscription = (req as any).activeSubscription;

    const result = await branchService.createBranch(tenantId, userId, activeSubscription, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const { id } = req.params;

    const result = await branchService.updateBranch(tenantId, userId, id, req.body);
    res.status(200).json({ success: true, data: result });
  }

  async delete(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const { id } = req.params;

    const result = await branchService.deleteBranch(tenantId, userId, id);
    res.status(200).json({ success: true, data: result });
  }
}
