import { Router } from 'express';
import { VehicleDocumentController } from '../controllers/VehicleDocumentController';
import { validate } from '../middlewares/validate';
import { createVehicleDocumentSchema } from '../validations/vehicleDocument.schema';
import { verifyToken, requireOwner, requireOperationalTenant } from '../middlewares/authMiddleware';

const router = Router({ mergeParams: true }); // Allows accessing :vehicleId from parent route
const controller = new VehicleDocumentController();

router.use(verifyToken, requireOwner, requireOperationalTenant);

router.post('/', validate(createVehicleDocumentSchema), controller.create);
router.get('/', controller.list);

export default router;
