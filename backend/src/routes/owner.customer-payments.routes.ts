import { Router } from 'express';
import { OwnerPaymentController } from '../controllers/OwnerPaymentController';
import { verifyToken, requireOwner, requireOperationalTenant } from '../middlewares/authMiddleware';

const router = Router();
const controller = new OwnerPaymentController();

router.use(verifyToken);
// We might want to allow STAFF as well, so requireOwner allows both Owner and Staff. 
// Granular permissions will be handled on the frontend or a specific permissions middleware.
router.use(requireOwner);
router.use(requireOperationalTenant);

router.post('/', controller.recordPayment.bind(controller));
router.get('/', controller.list.bind(controller));

export default router;
