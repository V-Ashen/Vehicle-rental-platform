import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { validate } from '../middlewares/validate';
import { createCustomerSchema, updateCustomerSchema } from '../validations/customer.schema';
import { verifyToken, requireOwner, requireOperationalTenant } from '../middlewares/authMiddleware';

const router = Router();
const controller = new CustomerController();

// Apply global middlewares for Phase 4 routes: Authentication -> Owner Check -> Operational Guard
router.use(verifyToken, requireOwner, requireOperationalTenant);

router.post('/', validate(createCustomerSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.put('/:id', validate(updateCustomerSchema), controller.update);

export default router;
