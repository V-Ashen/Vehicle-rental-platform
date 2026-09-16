import { Router } from 'express';
import { OwnerProfileController } from '../controllers/OwnerProfileController';
import { validate } from '../middlewares/validate';
import { updateOwnerProfileSchema } from '../validations/owner.profile.schema';
import { verifyToken, requireOwner, requireEmailVerified } from '../middlewares/authMiddleware';

const router = Router();
const controller = new OwnerProfileController();

router.use(verifyToken, requireOwner, requireEmailVerified);

router.get('/', controller.get);
router.put('/', validate(updateOwnerProfileSchema), controller.update);
router.post('/submit', controller.submit);

export default router;
