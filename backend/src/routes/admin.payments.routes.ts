import { Router } from 'express';
import { AdminPaymentController } from '../controllers/AdminPaymentController';
import { verifyToken } from '../middlewares/authMiddleware';
import { requireSaaSAdmin } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AdminPaymentController();

router.use(verifyToken);
router.use(requireSaaSAdmin);

router.get('/', controller.list.bind(controller));

export default router;
