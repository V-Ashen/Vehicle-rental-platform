import { Router } from 'express';
import { OwnerUploadController } from '../controllers/OwnerUploadController';
import { validate } from '../middlewares/validate';
import { generateSignedUrlSchema } from '../validations/owner.upload.schema';
import { verifyToken, requireOwner, requireEmailVerified } from '../middlewares/authMiddleware';

const router = Router();
const controller = new OwnerUploadController();

router.use(verifyToken, requireOwner, requireEmailVerified);

router.post('/generate-signed-url', validate(generateSignedUrlSchema), controller.generateSignedUrl);

export default router;
