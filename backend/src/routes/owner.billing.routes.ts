import { Router } from 'express';
import { OwnerBillingController } from '../controllers/OwnerBillingController';
import { verifyToken, requireOwner } from '../middlewares/authMiddleware';

const router = Router();
const controller = new OwnerBillingController();

router.use(verifyToken, requireOwner);

router.get('/subscription', controller.getSubscription);
router.get('/payments', controller.getPayments);
router.get('/packages', controller.listPackages);

export default router;
