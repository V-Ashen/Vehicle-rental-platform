import { Router } from 'express';
import { MaintenanceController } from '../controllers/MaintenanceController';
import { validate } from '../middlewares/validate';
import { createMaintenanceSchema } from '../validations/maintenance.schema';
import { verifyToken, requireOwner, requireOperationalTenant } from '../middlewares/authMiddleware';

const router = Router();
const controller = new MaintenanceController();

router.use(verifyToken, requireOwner, requireOperationalTenant);

router.post('/', validate(createMaintenanceSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);

export default router;
