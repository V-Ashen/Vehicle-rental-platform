import { WebhookService } from '../../services/WebhookService';
import { db } from '../../config/firebase';

jest.mock('../../config/firebase', () => ({
  db: { 
    collection: jest.fn(),
    runTransaction: jest.fn()
  }
}));

jest.mock('../../services/NotificationService', () => {
  return {
    NotificationService: jest.fn().mockImplementation(() => ({
      queueNotification: jest.fn().mockResolvedValue({})
    }))
  };
});

describe('WebhookService - Idempotency', () => {
  let service: WebhookService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WebhookService();
  });

  it('should successfully process a payment and update subscription on FIRST webhook', async () => {
    const mockPaymentGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ tenantId: 'TEN-1', status: 'PENDING', paymentType: 'SUBSCRIPTION', referenceId: 'SUB-1', amount: 5000, currency: 'LKR' })
    });
    const mockSubGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ tenantId: 'TEN-1', status: 'TRIAL' })
    });
    
    // Setup transaction mock behavior
    const mockTransaction = { get: jest.fn(), update: jest.fn(), set: jest.fn() };
    
    // Route t.get() depending on the reference passed
    mockTransaction.get.mockImplementation((ref) => {
      if (ref === 'PAY-REF') return mockPaymentGet();
      if (ref === 'SUB-REF') return mockSubGet();
    });

    (db.runTransaction as jest.Mock).mockImplementation(async (cb) => cb(mockTransaction));
    
    // Route db.collection().doc() depending on collection
    (db.collection as jest.Mock).mockImplementation((col) => ({
      doc: jest.fn().mockImplementation(() => {
        if (col === 'payments') return 'PAY-REF';
        if (col === 'subscriptions') return 'SUB-REF';
      })
    }));

    const mockPayload = { order_id: 'PAY-1', transaction_id: 'TXN-123', status: 2 };
    await service.handlePaymentWebhook(mockPayload, 'mock-sig');

    // Verification
    expect(mockTransaction.update).toHaveBeenCalledTimes(2); // 1 for Payment, 1 for Subscription
    expect(mockTransaction.update).toHaveBeenCalledWith('PAY-REF', expect.objectContaining({ status: 'SUCCESS' }));
    expect(mockTransaction.update).toHaveBeenCalledWith('SUB-REF', expect.objectContaining({ status: 'ACTIVE' }));
  });

  it('should safely BAIL OUT and NOT update anything on SECOND duplicate webhook (Idempotency Check)', async () => {
    // This time, the payment is ALREADY marked as SUCCESS
    const mockPaymentGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ tenantId: 'TEN-1', status: 'SUCCESS', paymentType: 'SUBSCRIPTION', referenceId: 'SUB-1' })
    });
    
    const mockTransaction = { get: jest.fn(), update: jest.fn(), set: jest.fn() };
    mockTransaction.get.mockImplementation((ref) => {
      if (ref === 'PAY-REF') return mockPaymentGet();
    });

    (db.runTransaction as jest.Mock).mockImplementation(async (cb) => cb(mockTransaction));
    
    (db.collection as jest.Mock).mockImplementation((col) => ({
      doc: jest.fn().mockImplementation(() => {
        if (col === 'payments') return 'PAY-REF';
      })
    }));

    const mockPayload = { order_id: 'PAY-1', transaction_id: 'TXN-123', status: 2 }; // Same payload
    await service.handlePaymentWebhook(mockPayload, 'mock-sig');

    // Verification - IT SHOULD BAIL OUT
    // The transaction should NOT have called update because of the `if (payment.status === 'SUCCESS') return;` check!
    expect(mockTransaction.update).toHaveBeenCalledTimes(0); 
  });
});
