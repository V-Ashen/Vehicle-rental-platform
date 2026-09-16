import { Router } from 'express';
import { AdminPackageController } from '../controllers/AdminPackageController';
import { validate } from '../middlewares/validate';
import { createPackageSchema, updatePackageSchema, updatePackageStatusSchema } from '../validations/admin.packages.schema';
import { verifyToken, requireSaaSAdmin } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AdminPackageController();

router.use(verifyToken, requireSaaSAdmin);

router.post('/', validate(createPackageSchema), controller.create);
router.get('/', controller.list);
router.put('/:id', validate(updatePackageSchema), controller.update);
router.patch('/:id/status', validate(updatePackageStatusSchema), controller.updateStatus);

export default router;
