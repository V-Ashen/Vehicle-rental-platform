import { Router } from 'express';
import { AdminPaymentRequestController } from '../controllers/AdminPaymentRequestController';
import { validate } from '../middlewares/validate';
import { rejectPaymentRequestSchema } from '../validations/admin.payment-requests.schema';
import { verifyToken, requireSaaSAdmin, requireSaaSRole } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AdminPaymentRequestController();

router.use(verifyToken, requireSaaSAdmin, requireSaaSRole(['FINANCE_ADMIN']));

router.get('/', controller.list);
router.patch('/:id/approve', controller.approve);
router.patch('/:id/reject', validate(rejectPaymentRequestSchema), controller.reject);

export default router;
