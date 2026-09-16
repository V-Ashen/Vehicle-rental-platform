import { ReportService } from '../../services/ReportService';
import { db } from '../../config/firebase';

jest.mock('../../config/firebase', () => ({
  db: { 
    collection: jest.fn()
  }
}));

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportService();
  });

  describe('getFinancialReport', () => {
    it('should use Firestore aggregation API and return correct sums', async () => {
      const mockAggregateGet = jest.fn().mockResolvedValue({
        data: () => ({
          totalRevenue: 10000,
          totalExtraKm: 500,
          totalLate: 200,
          totalDamage: 1000
        })
      });

      const mockAggregate = jest.fn().mockReturnValue({ get: mockAggregateGet });
      
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        aggregate: mockAggregate
      };

      (db.collection as jest.Mock).mockReturnValue(mockQuery);

      const result = await service.getFinancialReport('TEN-1', '2026-09-01T00:00:00Z', '2026-09-30T23:59:59Z');

      expect(db.collection).toHaveBeenCalledWith('rentalReturns');
      expect(mockQuery.where).toHaveBeenCalledWith('tenantId', '==', 'TEN-1');
      expect(mockAggregate).toHaveBeenCalled();
      
      expect(result.totalRevenue).toBe(10000);
      expect(result.totalExtraKm).toBe(500);
      expect(result.totalLate).toBe(200);
      expect(result.totalDamage).toBe(1000);
      expect(result.period.startDate).toBe('2026-09-01T00:00:00Z');
    });
  });
});
