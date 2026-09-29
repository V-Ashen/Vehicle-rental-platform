import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { verifyToken, requireOwner } from '../middlewares/authMiddleware';

const router = Router();
const notificationController = new NotificationController();

// Use both to ensure user is logged in and ownerUser/staffUser is populated on req
router.use(verifyToken, requireOwner);

router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
