import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { validate } from '../middlewares/validate';
import { financialReportSchema } from '../validations/report.schema';
import { verifyToken, requireOwner, requireOperationalTenant } from '../middlewares/authMiddleware';

const router = Router();
const controller = new ReportController();

router.use(verifyToken, requireOwner, requireOperationalTenant);

router.get('/financial', validate(financialReportSchema), controller.getFinancial);

export default router;
