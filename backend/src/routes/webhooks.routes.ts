import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';

const router = Router();
const controller = new WebhookController();

// Note: No authentication middleware. This is public for the gateway.
router.post('/payments', controller.handlePayments);

export default router;
