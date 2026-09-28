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

  async getDetailed(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const filters = req.query;
    
    try {
      const result = await reportService.getDetailedReport(tenantId, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error.statusCode === 403) {
        res.status(403).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
    }
  }

  async exportDetailed(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;
    const filters = req.query;
    
    try {
      const csvString = await reportService.exportDetailedReport(tenantId, filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
      res.status(200).send(csvString);
    } catch (error: any) {
      if (error.statusCode === 403) {
        res.status(403).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
    }
  }
}
