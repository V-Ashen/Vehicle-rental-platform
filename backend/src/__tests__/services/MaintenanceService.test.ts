import { MaintenanceService } from '../../services/MaintenanceService';
import { db } from '../../config/firebase';

jest.mock('../../config/firebase', () => ({
  db: { 
    collection: jest.fn(),
    runTransaction: jest.fn()
  }
}));

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MaintenanceService();
  });

  describe('createMaintenance', () => {
    it('should update vehicle status to AVAILABLE when markVehicleAvailable is true', async () => {
      const mockDocGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ tenantId: 'TEN-1', status: 'MAINTENANCE' })
      });
      const mockTransaction = { get: mockDocGet, update: jest.fn(), set: jest.fn() };
      
      (db.runTransaction as jest.Mock).mockImplementation(async (cb) => cb(mockTransaction));
      (db.collection as jest.Mock).mockReturnValue({ doc: jest.fn().mockReturnValue({}) });

      const data = {
        vehicleId: 'VEH-1',
        maintenanceType: 'SERVICE',
        description: 'Oil change',
        serviceDate: new Date().toISOString(),
        odometer: 10000,
        cost: 150,
        markVehicleAvailable: true
      };

      await service.createMaintenance('TEN-1', data, 'USER-1');

      expect(mockTransaction.set).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'AVAILABLE' })
      );
    });

    it('should NOT update vehicle status when markVehicleAvailable is false', async () => {
      const mockDocGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ tenantId: 'TEN-1', status: 'MAINTENANCE' })
      });
      const mockTransaction = { get: mockDocGet, update: jest.fn(), set: jest.fn() };
      
      (db.runTransaction as jest.Mock).mockImplementation(async (cb) => cb(mockTransaction));
      (db.collection as jest.Mock).mockReturnValue({ doc: jest.fn().mockReturnValue({}) });

      const data = {
        vehicleId: 'VEH-1',
        maintenanceType: 'SERVICE',
        description: 'Oil change',
        serviceDate: new Date().toISOString(),
        odometer: 10000,
        cost: 150,
        markVehicleAvailable: false
      };

      await service.createMaintenance('TEN-1', data, 'USER-1');

      expect(mockTransaction.set).toHaveBeenCalled();
      expect(mockTransaction.update).not.toHaveBeenCalled(); // No status update
    });
  });
});
