import { requireOperationalTenant } from '../../middlewares/authMiddleware';
import { Request, Response, NextFunction } from 'express';

// Setup basic mocks
const mockNext = jest.fn();
const mockRes = {} as Response;

jest.mock('../../config/firebase', () => ({
  db: { collection: jest.fn() },
  auth: {},
  storage: { bucket: jest.fn() }
}));

const mockFindById = jest.fn();
const mockFindByQuery = jest.fn();

jest.mock('../../repositories/TenantRepository', () => {
  return {
    TenantRepository: jest.fn().mockImplementation(() => {
      return { findById: mockFindById };
    })
  };
});

jest.mock('../../repositories/SubscriptionRepository', () => {
  return {
    SubscriptionRepository: jest.fn().mockImplementation(() => {
      return { findByQuery: mockFindByQuery };
    })
  };
});

describe('requireOperationalTenant Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should block if tenant profile is not VERIFIED', async () => {
    const mockReq = {
      ownerUser: { tenantId: 'TEN-1' }
    } as any;

    mockFindById.mockResolvedValueOnce({
      id: 'TEN-1',
      accountStatus: 'ACTIVE',
      profileStatus: 'PENDING' // Not verified
    });

    await requireOperationalTenant(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Business profile must be verified before proceeding'
    }));
  });

  it('should block if subscription is EXPIRED', async () => {
    const mockReq = {
      ownerUser: { tenantId: 'TEN-1' }
    } as any;

    mockFindById.mockResolvedValueOnce({
      id: 'TEN-1',
      accountStatus: 'ACTIVE',
      profileStatus: 'VERIFIED'
    });

    mockFindByQuery.mockResolvedValueOnce([
      { id: 'SUB-1', status: 'EXPIRED' }
    ]);

    await requireOperationalTenant(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
      message: 'No active or trial subscription found'
    }));
  });

  it('should allow if tenant is ACTIVE, VERIFIED and subscription is TRIAL', async () => {
    const mockReq = {
      ownerUser: { tenantId: 'TEN-1' }
    } as any;

    mockFindById.mockResolvedValueOnce({
      id: 'TEN-1',
      accountStatus: 'ACTIVE',
      profileStatus: 'VERIFIED'
    });

    mockFindByQuery.mockResolvedValueOnce([
      { id: 'SUB-1', status: 'TRIAL' }
    ]);

    await requireOperationalTenant(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(); // Called with no error
    expect(mockReq.tenant.id).toBe('TEN-1');
    expect(mockReq.activeSubscription.status).toBe('TRIAL');
  });
});
