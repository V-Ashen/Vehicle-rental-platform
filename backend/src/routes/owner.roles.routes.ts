import { Router } from 'express';
import { OwnerRolesController } from '../controllers/OwnerRolesController';
import { verifyToken, requireOwner } from '../middlewares/authMiddleware';

const router = Router();
const controller = new OwnerRolesController();

router.use(verifyToken, requireOwner);

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
