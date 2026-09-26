import { Router } from 'express';
import { AdminEmailsController } from '../controllers/AdminEmailsController';
import { verifyToken, requireSaaSAdmin } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AdminEmailsController();

// Protect all admin email routes
router.use(verifyToken);
router.use(requireSaaSAdmin);

router.get('/templates', controller.getTemplates.bind(controller));
router.post('/test', controller.testTemplate.bind(controller));

export default router;
