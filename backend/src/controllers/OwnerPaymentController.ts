import { Request, Response } from 'express';
import { OwnerPaymentService } from '../services/OwnerPaymentService';

const paymentService = new OwnerPaymentService();

export class OwnerPaymentController {
  async recordPayment(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    
    const result = await paymentService.recordPayment(tenantId, userId, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async list(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;

    const result = await paymentService.listPayments(tenantId, limit, cursor);
    res.status(200).json({ success: true, data: result });
  }
}
