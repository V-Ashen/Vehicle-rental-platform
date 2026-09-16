import { Router } from 'express';
import { AdminTenantController } from '../controllers/AdminTenantController';
import { validate } from '../middlewares/validate';
import { updateTenantProfileStatusSchema, updateTenantAccountStatusSchema } from '../validations/admin.tenants.schema';
import { verifyToken, requireSaaSAdmin } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AdminTenantController();

router.use(verifyToken, requireSaaSAdmin);

router.get('/', controller.list);
router.get('/:id', controller.get);
router.patch('/:id/profile-status', validate(updateTenantProfileStatusSchema), controller.updateProfileStatus);
router.patch('/:id/account-status', validate(updateTenantAccountStatusSchema), controller.updateAccountStatus);

export default router;
