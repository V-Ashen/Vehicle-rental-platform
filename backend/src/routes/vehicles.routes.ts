import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { validate } from '../middlewares/validate';
import { createVehicleSchema, updateVehicleSchema } from '../validations/vehicle.schema';
import { verifyToken, requireOwner, requireOperationalTenant } from '../middlewares/authMiddleware';
import vehicleDocumentRoutes from './vehicleDocuments.routes';

const router = Router();
const controller = new VehicleController();

// Apply global middlewares for Phase 4 routes: Authentication -> Owner Check -> Operational Guard
router.use(verifyToken, requireOwner, requireOperationalTenant);

// Nested resource: Vehicle Documents
router.use('/:vehicleId/documents', vehicleDocumentRoutes);

router.post('/', validate(createVehicleSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.put('/:id', validate(updateVehicleSchema), controller.update);

export default router;
