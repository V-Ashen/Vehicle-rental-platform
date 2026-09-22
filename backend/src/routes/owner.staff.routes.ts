import { Router } from 'express';
import { OwnerStaffController } from '../controllers/OwnerStaffController';
import { verifyToken, requireOwner } from '../middlewares/authMiddleware';

const router = Router();
const controller = new OwnerStaffController();

router.use(verifyToken, requireOwner);

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);

export default router;
