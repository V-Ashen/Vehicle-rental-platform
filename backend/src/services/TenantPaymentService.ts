import { PaymentRequestRepository } from '../repositories/PaymentRequestRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { PackageRepository } from '../repositories/PackageRepository';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { TenantRepository } from '../repositories/TenantRepository';
import { MockGatewayProvider } from '../providers/MockGatewayProvider';
import { AppError } from '../utils/AppError';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { db } from '../config/firebase';

const paymentRequestRepo = new PaymentRequestRepository();
const packageRepo = new PackageRepository();
const subRepo = new SubscriptionRepository();
const tenantRepo = new TenantRepository();
const provider = new MockGatewayProvider();

export class TenantPaymentService {
  async submitBankTransfer(tenantId: string, data: { packageId: string, slipUrl: string }, userId: string) {
    const pkg = await packageRepo.findById(data.packageId);
    if (!pkg) throw new AppError('Package not found', 'NOT_FOUND', 404);

    // Get current subscription
    const subs = await subRepo.findAllPaginated(1, undefined, 'createdAt', 'desc', [
      { field: 'tenantId', operator: '==', value: tenantId }
    ]);
    const currentSub = subs.data[0];
    if (!currentSub) throw new AppError('Active subscription not found', 'NOT_FOUND', 404);

    const prqId = generateId(IdPrefix.PAYMENT_REQUEST);
    const result = await paymentRequestRepo.create(prqId, {
      tenantId,
      subscriptionId: currentSub.id,
      packageId: data.packageId,
      amount: pkg.monthlyPrice, // Defaulting to monthly for MVP
      currency: 'LKR',
      method: 'BANK_TRANSFER',
      slipUrl: data.slipUrl,
      submittedAt: new Date(),
      status: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      createdBy: userId,
      updatedBy: userId
    });

    return result;
  }

  async initializeCheckout(tenantId: string, data: { packageId: string }, userId: string) {
    const pkg = await packageRepo.findById(data.packageId);
    if (!pkg) throw new AppError('Package not found', 'NOT_FOUND', 404);
    
    const tenant = await tenantRepo.findById(tenantId);
    if (!tenant) throw new AppError('Tenant not found', 'NOT_FOUND', 404);

    const subs = await subRepo.findAllPaginated(1, undefined, 'createdAt', 'desc', [
      { field: 'tenantId', operator: '==', value: tenantId }
    ]);
    const currentSub = subs.data[0];
    if (!currentSub) throw new AppError('Active subscription not found', 'NOT_FOUND', 404);

    const paymentId = generateId(IdPrefix.PAYMENT);
    
    const paymentData = {
      id: paymentId,
      tenantId,
      paymentType: 'SUBSCRIPTION',
      referenceId: currentSub.id,
      amount: pkg.monthlyPrice,
      currency: 'LKR',
      method: 'ONLINE',
      provider: 'MOCK_GATEWAY',
      providerTransactionId: null,
      status: 'PENDING',
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      updatedBy: userId
    };

    // Save payment record
    const paymentRef = db.collection('payments').doc(paymentId);
    await paymentRef.set(paymentData);

    // Generate checkout URL
    const checkoutUrl = await provider.generateCheckoutUrl({
      orderId: paymentId,
      amount: pkg.monthlyPrice,
      currency: 'LKR',
      customerName: tenant.businessName,
      customerEmail: tenant.email
    });

    return {
      paymentId,
      checkoutUrl
    };
  }
}
