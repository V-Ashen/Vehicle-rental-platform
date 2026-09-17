import { Router } from 'express';
import { OwnerDashboardController } from '../controllers/OwnerDashboardController';
import { verifyToken, requireOwner } from '../middlewares/authMiddleware';

const router = Router();
const dashboardController = new OwnerDashboardController();

router.use(verifyToken, requireOwner);

router.get('/', dashboardController.getMetrics);

export default router;
