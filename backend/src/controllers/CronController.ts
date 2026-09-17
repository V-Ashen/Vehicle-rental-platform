import { Request, Response } from 'express';
import { CronService } from '../services/CronService';

const cronService = new CronService();

export class CronController {
  async processNotifications(req: Request, res: Response) {
    const result = await cronService.processNotifications();
    res.status(200).json({ success: true, data: result });
  }

  async processDailySubscriptions(req: Request, res: Response) {
    const result = await cronService.processDailySubscriptions();
    res.status(200).json({ success: true, data: result });
  }
}
