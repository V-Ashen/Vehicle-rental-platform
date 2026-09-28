import { Request, Response } from 'express';
import { AdminDashboardService } from '../services/AdminDashboardService';

const dashboardService = new AdminDashboardService();

export class AdminDashboardController {
  async getMetrics(req: Request, res: Response) {
    const [metrics, activity] = await Promise.all([
      dashboardService.getMetrics(),
      dashboardService.getRecentActivity()
    ]);
    res.status(200).json({ success: true, data: { ...metrics, activity } });
  }
}
