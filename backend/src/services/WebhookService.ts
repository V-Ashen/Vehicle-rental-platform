import { db } from '../config/firebase';
import { IPaymentProvider } from '../providers/IPaymentProvider';
import { MockGatewayProvider } from '../providers/MockGatewayProvider';
import { NotificationService } from './NotificationService';
import { AppError } from '../utils/AppError';
import { PackageRepository } from '../repositories/PackageRepository';
import { AuditLogService } from './AuditLogService';

const notificationService = new NotificationService();
const packageRepo = new PackageRepository();
const auditService = new AuditLogService();
const provider: IPaymentProvider = new MockGatewayProvider();

export class WebhookService {
  async handlePaymentWebhook(payload: any, signature: string) {
    // 1. Verify Signature
    const isValid = provider.verifySignature(payload, signature);
    if (!isValid) {
      throw new AppError('Invalid webhook signature', 'UNAUTHORIZED', 401);
    }

    // 2. Parse payload uniformly
    const { paymentId, providerTransactionId, status, rawPayload } = provider.parseWebhook(payload);

    try {
      await db.runTransaction(async (t) => {
        // 3. The Idempotency Check
        const paymentRef = db.collection('payments').doc(paymentId);
        const paymentDoc = await t.get(paymentRef);
        
        if (!paymentDoc.exists) {
          console.warn(`Webhook received for unknown paymentId: ${paymentId}`);
          return; // Safely ignore or log
        }

        const payment = paymentDoc.data();

        // **IDEMPOTENCY LOCK**
        if (payment?.status === 'SUCCESS') {
          console.log(`Payment ${paymentId} is already marked SUCCESS. Idempotency triggered.`);
          return; // Bail out. Do not throw an error, let the gateway know we handled it.
        }

        // 4. If status is SUCCESS from gateway
        if (status === 'SUCCESS') {
          // Update Payment Record
          t.update(paymentRef, {
            status: 'SUCCESS',
            providerTransactionId,
            paidAt: new Date(),
            updatedAt: new Date(),
            updatedBy: 'SYSTEM_WEBHOOK'
          });

          // Update Subscription
          if (payment?.paymentType === 'SUBSCRIPTION' && payment?.referenceId) {
            const subRef = db.collection('subscriptions').doc(payment.referenceId);
            const subDoc = await t.get(subRef);
            
            if (subDoc.exists) {
              const currentSub = subDoc.data();
              // Calculate new end date (+30 days for MVP)
              const now = new Date();
              const newEndAt = new Date(now.setDate(now.getDate() + 30));

              t.update(subRef, {
                status: 'ACTIVE',
                trialEndAt: newEndAt, // Or a dedicated `endAt` field depending on schema, reusing trialEndAt for simplicity
                updatedAt: new Date(),
                updatedBy: 'SYSTEM_WEBHOOK'
              });

              // Fire Notification safely inside the async block
              notificationService.queueNotification(payment.tenantId, 'TENANT_ADMIN', {
                type: 'PAYMENT_RECEIPT',
                channel: 'EMAIL',
                subject: 'Payment Successful',
                message: `Your payment of ${payment.amount} ${payment.currency} was successful. Transaction ID: ${providerTransactionId}`
              }).catch(e => console.error('Failed to queue notification', e));
            }
          }
        } else if (status === 'FAILED') {
          t.update(paymentRef, {
            status: 'FAILED',
            providerTransactionId,
            updatedAt: new Date(),
            updatedBy: 'SYSTEM_WEBHOOK'
          });
        }
      });
    } catch (error: any) {
      console.error('Webhook transaction failed:', error);
      throw new AppError('Failed to process webhook', 'INTERNAL_SERVER_ERROR', 500);
    }

    // Outside the transaction, log the audit event if SUCCESS
    if (status === 'SUCCESS') {
      try {
        const paymentRef = db.collection('payments').doc(paymentId);
        const paymentDoc = await paymentRef.get();
        if (paymentDoc.exists) {
          const paymentData = paymentDoc.data() as any;
          await auditService.logAction(
            paymentData.tenantId,
            'SYSTEM_WEBHOOK',
            'SUBSCRIPTION_ACTIVATED',
            'BILLING',
            paymentId,
            { status: 'PENDING' },
            { status: 'SUCCESS', providerTransactionId }
          );
        }
      } catch (e) {
        console.error('Failed to write audit log in webhook', e);
      }
    }
  }
}
