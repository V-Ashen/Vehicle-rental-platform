import { Request, Response } from 'express';
import { ReportService } from '../services/ReportService';

const reportService = new ReportService();

export class ReportController {
  async getFinancial(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const { startDate, endDate } = req.query;
    
    const result = await reportService.getFinancialReport(
      tenantId, 
      startDate as string, 
      endDate as string
    );
    
    res.status(200).json({ success: true, data: result });
  }
}
