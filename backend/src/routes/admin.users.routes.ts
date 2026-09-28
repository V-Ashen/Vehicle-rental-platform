import { Router } from 'express';
import { AdminUsersController } from '../controllers/AdminUsersController';
import { verifyToken, requireSaaSAdmin, requireSaaSRole } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AdminUsersController();

// Only SUPER_ADMIN can manage other SaaS users
router.use(verifyToken, requireSaaSAdmin, requireSaaSRole(['SUPER_ADMIN']));

router.get('/', controller.list.bind(controller));
router.post('/', controller.invite.bind(controller));

export default router;
