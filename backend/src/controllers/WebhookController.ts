import { Request, Response } from 'express';
import { WebhookService } from '../services/WebhookService';

const webhookService = new WebhookService();

export class WebhookController {
  async handlePayments(req: Request, res: Response) {
    const signature = req.headers['x-signature'] as string || 'mock-signature';
    
    // Pass raw body or parsed JSON depending on gateway needs. 
    // Usually raw body is needed for signature verification, but we use Mock.
    await webhookService.handlePaymentWebhook(req.body, signature);
    
    res.status(200).send('OK');
  }
}
