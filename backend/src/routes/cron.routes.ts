import { Router } from 'express';
import { CronController } from '../controllers/CronController';
import { requireCronSecret } from '../middlewares/cronMiddleware';

const router = Router();
const controller = new CronController();

// All routes here are protected by the cron secret header
router.use(requireCronSecret);

router.post('/process-notifications', controller.processNotifications);
router.post('/daily-subscriptions', controller.processDailySubscriptions);
router.post('/daily-rentals', controller.processDailyRentals);

export default router;
