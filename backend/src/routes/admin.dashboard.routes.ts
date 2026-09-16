import { Router } from 'express';
import { AdminDashboardController } from '../controllers/AdminDashboardController';
import { verifyToken, requireSaaSAdmin } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AdminDashboardController();

router.use(verifyToken, requireSaaSAdmin);

router.get('/metrics', controller.getMetrics);

export default router;
