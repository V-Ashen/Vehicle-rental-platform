import { TenantRepository } from '../repositories/TenantRepository';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { PaymentRequestRepository } from '../repositories/PaymentRequestRepository';

const tenantRepo = new TenantRepository();
const subRepo = new SubscriptionRepository();
const prRepo = new PaymentRequestRepository();

export class AdminDashboardService {
  async getMetrics() {
    // totalBusinesses (Count of all tenants)
    const totalBusinesses = await tenantRepo.count();

    // activeBusinesses (Count of tenants where accountStatus = ACTIVE)
    const activeBusinesses = await tenantRepo.count([{ field: 'accountStatus', operator: '==', value: 'ACTIVE' }]);

    // suspendedBusinesses (Count of tenants where accountStatus = SUSPENDED)
    const suspendedBusinesses = await tenantRepo.count([{ field: 'accountStatus', operator: '==', value: 'SUSPENDED' }]);

    // trialBusinesses (Count of subscriptions where status = TRIAL)
    const trialBusinesses = await subRepo.count([{ field: 'status', operator: '==', value: 'TRIAL' }]);

    // totalActiveSubscriptions (Count of subscriptions where status = ACTIVE)
    const totalActiveSubscriptions = await subRepo.count([{ field: 'status', operator: '==', value: 'ACTIVE' }]);

    // pendingPaymentRequests (Count of paymentRequests where status = PENDING)
    const pendingPaymentRequests = await prRepo.count([{ field: 'status', operator: '==', value: 'PENDING' }]);

    return {
      totalBusinesses,
      activeBusinesses,
      suspendedBusinesses,
      trialBusinesses,
      totalActiveSubscriptions,
      pendingPaymentRequests
    };
  }
}
