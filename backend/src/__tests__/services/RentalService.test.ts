import { RentalService } from '../../services/RentalService';
import { CustomerRepository } from '../../repositories/CustomerRepository';
import { AppError } from '../../utils/AppError';
import { db } from '../../config/firebase';

jest.mock('../../config/firebase', () => ({
  db: { 
    collection: jest.fn(),
    runTransaction: jest.fn()
  }
}));

jest.mock('../../repositories/CustomerRepository');
jest.mock('../../repositories/VehicleRepository');
jest.mock('../../repositories/RentalRepository');
jest.mock('../../repositories/RentalHandoverRepository');

describe('RentalService', () => {
  let service: RentalService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RentalService();
  });

  describe('createRental', () => {
    const now = new Date();
    const validData = {
      customerId: 'CUS-1',
      vehicleId: 'VEH-1',
      pickupAt: now.toISOString(),
      expectedReturnAt: new Date(now.getTime() + 48 * 36e5).toISOString() // Exactly 48 hours
    };

    it('should calculate rentalDays properly and snapshot prices', async () => {
      jest.spyOn(CustomerRepository.prototype, 'findById').mockResolvedValue({ id: 'CUS-1', tenantId: 'TEN-1' } as any);
      
      const mockDocGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ tenantId: 'TEN-1', status: 'AVAILABLE', dailyRate: 50, extraKmRate: 2, includedKmPerDay: 100 })
      });
      const mockTransaction = { get: mockDocGet, update: jest.fn(), set: jest.fn() };
      
      (db.runTransaction as jest.Mock).mockImplementation(async (cb) => cb(mockTransaction));
      (db.collection as jest.Mock).mockReturnValue({ doc: jest.fn().mockReturnValue({}) });

      const result = await service.createRental('TEN-1', validData, 'USER-1');

      expect(result.rentalDays).toBe(2);
      expect(result.dailyRateSnapshot).toBe(50);
      expect(result.extraKmRateSnapshot).toBe(2);
      expect(result.includedKmSnapshot).toBe(200); // 2 days * 100
      expect(result.baseRentalAmount).toBe(100); // 2 days * 50
      expect(result.status).toBe('RESERVED');
      expect(mockTransaction.update).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalled();
    });

    it('should throw VEHICLE_NOT_AVAILABLE if vehicle status is not AVAILABLE (concurrency protection)', async () => {
      jest.spyOn(CustomerRepository.prototype, 'findById').mockResolvedValue({ id: 'CUS-1', tenantId: 'TEN-1' } as any);
      
      const mockDocGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ tenantId: 'TEN-1', status: 'RESERVED', dailyRate: 50 }) // Simulate booked just now
      });
      const mockTransaction = { get: mockDocGet };
      
      (db.runTransaction as jest.Mock).mockImplementation(async (cb) => cb(mockTransaction));
      (db.collection as jest.Mock).mockReturnValue({ doc: jest.fn().mockReturnValue({}) });

      await expect(service.createRental('TEN-1', validData, 'USER-1')).rejects.toThrow('VEHICLE_NOT_AVAILABLE');
    });
  });

  describe('returnRental', () => {
    it('should mathematically calculate Extra KM, Late Fees, and Damages perfectly', async () => {
      const expectedReturnAt = new Date('2026-10-01T10:00:00Z');
      const actualReturnAt = new Date('2026-10-01T12:30:00Z'); // 2.5 hours late = 150 minutes

      const returnData = {
        actualReturnAt: actualReturnAt.toISOString(),
        endOdometer: 50150, // 50km over the 100km included limit (if start was 50000)
        endFuelLevel: 'HALF',
        damages: [
          { damageArea: 'Bumper', damageType: 'SCRATCH', description: 'Deep scratch', estimatedCost: 300 },
          { damageArea: 'Door', damageType: 'DENT', description: 'Small dent', estimatedCost: 200 }
        ],
        otherCharges: 0,
        requiresMaintenance: true,
        gracePeriodMinutes: 60,
        hourlyLateCharge: 1000
      };

      const mockDocGet = jest.fn()
        // 1. Rental Get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            tenantId: 'TEN-1',
            status: 'ON_RENT',
            vehicleId: 'VEH-1',
            expectedReturnAt: expectedReturnAt.toISOString(),
            includedKmSnapshot: 100,
            extraKmRateSnapshot: 10,
            baseRentalAmount: 5000
          })
        })
        // 2. Vehicle Get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({})
        })
        // 3. Handover Get (Pickup)
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ data: () => ({ odometer: 50000 }) }]
        });

      const mockTransaction = {
        get: mockDocGet,
        update: jest.fn(),
        set: jest.fn()
      };

      (db.runTransaction as jest.Mock).mockImplementation(async (cb) => cb(mockTransaction));
      
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: mockDocGet, // This handles the handover fetch
        doc: jest.fn().mockReturnValue({}) // Need doc() for the creation step
      };

      (db.collection as jest.Mock).mockImplementation((collectionName) => {
        if (collectionName === 'rentalHandovers') return mockQuery;
        return { doc: jest.fn().mockReturnValue({}) };
      });

      const result = await service.returnRental('REN-1', 'TEN-1', returnData, 'USER-1');

      // Assertions for Math
      expect(result.usedKm).toBe(150); // 50150 - 50000
      expect(result.extraKm).toBe(50); // 150 - 100
      expect(result.extraKmCharge).toBe(500); // 50 * 10

      expect(result.lateMinutes).toBe(150); // 2.5 hours
      expect(result.billableLateMinutes).toBe(90); // 150 - 60 grace period
      expect(result.lateCharge).toBe(2000); // Math.ceil(90/60) = 2 hours * 1000

      expect(result.damageTotal).toBe(500); // 300 + 200

      // Final Total: 5000 base + 500 extraKm + 2000 late + 500 damages
      expect(result.finalTotal).toBe(8000); 

      // Assertions for Updates
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'MAINTENANCE', currentOdometer: 50150 }) // Vehicle updated to Maintenance
      );
    });
  });
});
