import { Request, Response } from 'express';
import { AdminPaymentRequestService } from '../services/AdminPaymentRequestService';

const prService = new AdminPaymentRequestService();

export class AdminPaymentRequestController {
  async list(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;
    const status = req.query.status as string;

    const result = await prService.listPaymentRequests(limit, cursor, status);
    res.status(200).json({ success: true, data: result });
  }

  async approve(req: Request, res: Response) {
    const adminId = (req as any).adminUser.id;
    const { id } = req.params;
    const result = await prService.approve(id as string, adminId);
    res.status(200).json({ success: true, data: result });
  }

  async reject(req: Request, res: Response) {
    const adminId = (req as any).adminUser.id;
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const result = await prService.reject(id as string, rejectionReason, adminId);
    res.status(200).json({ success: true, data: result });
  }
}
