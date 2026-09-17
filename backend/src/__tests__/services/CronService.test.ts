import { CronService } from '../../services/CronService';
import { db } from '../../config/firebase';

jest.mock('../../config/firebase', () => ({
  db: { 
    collection: jest.fn(),
    batch: jest.fn()
  }
}));

describe('CronService - Subscription Automation', () => {
  let service: CronService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CronService();
  });

  it('should EXPIRE the subscription, SUSPEND the tenant, and QUEUE a notification for an expired subscription', async () => {
    // Mock an expired subscription (trial ended 2 days ago)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const mockSubGet = jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'SUB-1',
          ref: 'SUB-DOC-REF',
          data: () => ({ tenantId: 'TEN-1', status: 'TRIAL', trialEndAt: twoDaysAgo })
        }
      ]
    });

    const mockCollection = jest.fn().mockImplementation((col) => {
      if (col === 'subscriptions') {
        return { where: jest.fn().mockReturnThis(), get: mockSubGet };
      }
      if (col === 'tenants') {
        return { doc: jest.fn().mockReturnValue('TENANT-DOC-REF') };
      }
      if (col === 'notifications') {
        return { doc: jest.fn().mockReturnValue('NOTIF-DOC-REF') };
      }
    });

    (db.collection as jest.Mock).mockImplementation(mockCollection);

    const mockBatch = { update: jest.fn(), set: jest.fn(), commit: jest.fn() };
    (db.batch as jest.Mock).mockReturnValue(mockBatch);

    const result = await service.processDailySubscriptions();

    expect(result.expiredCount).toBe(1);
    expect(mockBatch.update).toHaveBeenCalledTimes(2); // One for Sub, One for Tenant
    
    // Assert Subscription Expired
    expect(mockBatch.update).toHaveBeenCalledWith('SUB-DOC-REF', expect.objectContaining({ status: 'EXPIRED' }));
    
    // Assert Tenant Suspended
    expect(mockBatch.update).toHaveBeenCalledWith('TENANT-DOC-REF', expect.objectContaining({ accountStatus: 'SUSPENDED' }));
    
    // Assert Notification Queued
    expect(mockBatch.set).toHaveBeenCalledWith('NOTIF-DOC-REF', expect.objectContaining({
      type: 'ACCOUNT_SUSPENDED',
      status: 'QUEUED'
    }));
    
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});
