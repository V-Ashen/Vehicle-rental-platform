import { AdminPaymentRequestService } from '../../services/AdminPaymentRequestService';
import { db } from '../../config/firebase';
import { AppError } from '../../utils/AppError';

jest.mock('../../config/firebase', () => ({
  db: {
    collection: jest.fn(),
    runTransaction: jest.fn()
  }
}));

import { PaymentRequestRepository } from '../../repositories/PaymentRequestRepository';
jest.mock('../../repositories/PaymentRequestRepository');

describe('AdminPaymentRequestService', () => {
  let service: AdminPaymentRequestService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminPaymentRequestService();
  });

  describe('approve', () => {
    it('should run a successful approval transaction', async () => {
      const mockDocGet = jest.fn()
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ status: 'PENDING', subscriptionId: 'SUB-1', tenantId: 'TEN-1', amount: 100, currency: 'USD' })
        }) // PR doc
        .mockResolvedValueOnce({
          exists: true,
        }); // Sub doc
      
      const mockUpdate = jest.fn();
      const mockSet = jest.fn();

      const mockTransaction = {
        get: mockDocGet,
        update: mockUpdate,
        set: mockSet
      };

      (db.runTransaction as jest.Mock).mockImplementation(async (cb) => cb(mockTransaction));

      const mockDoc = jest.fn().mockReturnValue({});
      (db.collection as jest.Mock).mockReturnValue({ doc: mockDoc });

      const result = await service.approve('PR-1', 'ADMIN-1');

      expect(db.runTransaction).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledTimes(2); // PR update, Sub update
      expect(mockSet).toHaveBeenCalledTimes(1); // Payment create
      expect(result.status).toBe('APPROVED');
    });

    it('should rollback transaction if payment request is not pending', async () => {
      const mockDocGet = jest.fn()
        .mockResolvedValue({
          exists: true,
          data: () => ({ status: 'APPROVED', subscriptionId: 'SUB-1' })
        });
      
      const mockTransaction = { get: mockDocGet };

      (db.runTransaction as jest.Mock).mockImplementation(async (cb) => cb(mockTransaction));
      (db.collection as jest.Mock).mockReturnValue({ doc: jest.fn().mockReturnValue({}) });

      const promise = service.approve('PR-1', 'ADMIN-1');
      await expect(promise).rejects.toThrow(AppError);
      await expect(promise).rejects.toThrow('Payment request is not pending');
    });
  });
});
