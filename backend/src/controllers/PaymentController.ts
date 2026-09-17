import { Request, Response } from 'express';
import { TenantPaymentService } from '../services/TenantPaymentService';

const tenantPaymentService = new TenantPaymentService();

export class PaymentController {
  async submitBankTransfer(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    
    const result = await tenantPaymentService.submitBankTransfer(tenantId, req.body, userId);
    res.status(201).json({ success: true, data: result });
  }

  async initializeCheckout(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).ownerUser?.id || (req as any).staffUser?.id;
    
    const result = await tenantPaymentService.initializeCheckout(tenantId, req.body, userId);
    res.status(200).json({ success: true, data: result });
  }
}
