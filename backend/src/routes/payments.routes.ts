import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { validate } from '../middlewares/validate';
import { submitBankTransferSchema, initializeCheckoutSchema } from '../validations/payment.schema';
import { verifyToken, requireOwner, requireOperationalTenant } from '../middlewares/authMiddleware';

const router = Router();
const controller = new PaymentController();

router.use(verifyToken, requireOwner, requireOperationalTenant);

router.post('/bank-transfer', validate(submitBankTransferSchema), controller.submitBankTransfer);
router.post('/checkout', validate(initializeCheckoutSchema), controller.initializeCheckout);

export default router;
