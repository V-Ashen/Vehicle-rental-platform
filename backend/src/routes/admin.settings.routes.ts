import { Router } from 'express';
import { AdminSettingsController } from '../controllers/AdminSettingsController';
import { verifyToken, requireSaaSAdmin } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AdminSettingsController();

router.use(verifyToken, requireSaaSAdmin);

router.get('/', controller.getSettings.bind(controller));
router.put('/', controller.updateSettings.bind(controller));

export default router;
