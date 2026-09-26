import { Request, Response } from 'express';
import { TenantPaymentService } from '../services/TenantPaymentService';

const tenantPaymentService = new TenantPaymentService();

export class PaymentController {
  async submitBankTransfer(req: Request, res: Response) {
    const user = (req as any).ownerUser || (req as any).staffUser;
    const tenantId = user.tenantId;
    const userId = user.id;
    
    const result = await tenantPaymentService.submitBankTransfer(tenantId, req.body, userId);
    res.status(201).json({ success: true, data: result });
  }

  async initializeCheckout(req: Request, res: Response) {
    const user = (req as any).ownerUser || (req as any).staffUser;
    const tenantId = user.tenantId;
    const userId = user.id;
    
    const result = await tenantPaymentService.initializeCheckout(tenantId, req.body, userId);
    res.status(200).json({ success: true, data: result });
  }
}
