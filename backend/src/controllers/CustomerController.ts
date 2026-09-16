import { Request, Response } from 'express';
import { CustomerService } from '../services/CustomerService';

const customerService = new CustomerService();

export class CustomerController {
  async create(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const result = await customerService.createCustomer(tenantId, req.body, userId);
    res.status(201).json({ success: true, data: result });
  }

  async list(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const limit = parseInt(req.query.limit as string) || 25;
    const startAfterId = req.query.startAfter as string;
    
    const result = await customerService.getCustomers(tenantId, limit, startAfterId);
    res.status(200).json({ success: true, ...result });
  }

  async get(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const { id } = req.params;
    const result = await customerService.getCustomer(id as string, tenantId);
    res.status(200).json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    const { id } = req.params;
    const result = await customerService.updateCustomer(id as string, tenantId, req.body, userId);
    res.status(200).json({ success: true, data: result });
  }
}
