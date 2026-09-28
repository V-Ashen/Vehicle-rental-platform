import { Router } from 'express';
import { AdminPaymentController } from '../controllers/AdminPaymentController';
import { verifyToken } from '../middlewares/authMiddleware';
import { requireSaaSAdmin, requireSaaSRole } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AdminPaymentController();

router.use(verifyToken);
router.use(requireSaaSAdmin);
router.use(requireSaaSRole(['FINANCE_ADMIN']));

router.get('/', controller.list.bind(controller));

export default router;
