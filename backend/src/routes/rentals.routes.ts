import { Router } from 'express';
import { RentalController } from '../controllers/RentalController';
import { validate } from '../middlewares/validate';
import { createRentalSchema, handoverSchema, returnRentalSchema } from '../validations/rental.schema';
import { verifyToken, requireOwner, requireOperationalTenant } from '../middlewares/authMiddleware';

const router = Router();
const controller = new RentalController();

// Apply global middlewares for Phase 4 routes: Authentication -> Owner Check -> Operational Guard
router.use(verifyToken, requireOwner, requireOperationalTenant);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(createRentalSchema), controller.create);
router.post('/:id/handover', validate(handoverSchema), controller.handover);
router.post('/:id/return', validate(returnRentalSchema), controller.returnRental);
router.post('/:id/cancel', controller.cancelRental);

export default router;
