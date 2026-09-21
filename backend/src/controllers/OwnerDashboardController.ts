import { Request, Response, NextFunction } from 'express';
import { OwnerDashboardService } from '../services/OwnerDashboardService';

const dashboardService = new OwnerDashboardService();

export class OwnerDashboardController {
  getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).ownerUser.tenantId;
      const metrics = await dashboardService.getDashboardMetrics(tenantId);
      
      res.status(200).json({
        status: 'success',
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  };
}
