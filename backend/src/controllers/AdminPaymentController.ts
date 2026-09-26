import { Request, Response } from 'express';
import { AdminPaymentService } from '../services/AdminPaymentService';

const paymentService = new AdminPaymentService();

export class AdminPaymentController {
  async list(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;
    const status = req.query.status as string;

    const result = await paymentService.listPayments(limit, cursor, status);
    res.status(200).json({ success: true, data: result });
  }
}
