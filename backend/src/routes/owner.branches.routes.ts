import { Router } from 'express';
import { BranchController } from '../controllers/BranchController';
import { verifyToken, requireOwner, requireOperationalTenant } from '../middlewares/authMiddleware';

const router = Router();
const controller = new BranchController();

router.use(verifyToken);
// Branches can usually be managed by owner or specific staff.
router.use(requireOwner);
router.use(requireOperationalTenant);

router.get('/', controller.list.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
