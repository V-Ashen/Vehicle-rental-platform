import { PaymentRequestRepository } from '../repositories/PaymentRequestRepository';
import { db } from '../config/firebase';
import { AppError } from '../utils/AppError';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { AuditLogService } from './AuditLogService';

const prRepo = new PaymentRequestRepository();
const auditService = new AuditLogService();

export class AdminPaymentRequestService {
  async listPaymentRequests(limit: number = 20, cursor?: string, status?: string) {
    const filters: any[] = [];
    if (status) {
      filters.push({ field: 'status', operator: '==', value: status });
    }

    const { data, nextCursor } = await prRepo.findAllPaginated(limit, cursor, 'createdAt', 'desc', filters);
    const totalCount = await prRepo.count(filters);

    return {
      paymentRequests: data,
      pagination: {
        nextCursor,
        totalCount
      }
    };
  }

  async approve(id: string, adminId: string) {
    const prRef = db.collection('paymentRequests').doc(id);
    const paymentId = generateId(IdPrefix.PAYMENT);
    const paymentRef = db.collection('payments').doc(paymentId);
    
    try {
      const result = await db.runTransaction(async (t) => {
        const prDoc = await t.get(prRef);
        if (!prDoc.exists) {
          throw new AppError('Payment request not found', 'NOT_FOUND', 404);
        }

        const prData = prDoc.data() as any;
        
        if (prData.status !== 'PENDING') {
          throw new AppError('Payment request is not pending', 'INVALID_STATE', 400);
        }

        const subRef = db.collection('subscriptions').doc(prData.subscriptionId);
        const subDoc = await t.get(subRef);
        if (!subDoc.exists) {
          throw new AppError('Subscription not found', 'NOT_FOUND', 404);
        }

        const now = new Date();

        // 1. Update Payment Request to APPROVED
        t.update(prRef, {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: now,
          updatedAt: now,
          updatedBy: adminId
        });

        // 2. Create Payment record with SUCCESS
        t.set(paymentRef, {
          id: paymentId,
          tenantId: prData.tenantId,
          paymentType: 'SUBSCRIPTION',
          referenceId: prData.subscriptionId,
          amount: prData.amount,
          currency: prData.currency,
          method: 'BANK',
          provider: null,
          providerTransactionId: null,
          status: 'SUCCESS',
          paidAt: now,
          createdAt: now,
          updatedAt: now,
          createdBy: adminId,
          updatedBy: adminId
        });

        // 3. Update Subscription to ACTIVE
        t.update(subRef, {
          status: 'ACTIVE',
          updatedAt: now,
          updatedBy: adminId
        });

        return { paymentId, status: 'APPROVED', prData };
      });

      // Log the audit event asynchronously
      auditService.logAction(
        result.prData.tenantId,
        adminId,
        'PAYMENT_APPROVED',
        'BILLING',
        id,
        { status: 'PENDING' },
        { status: 'APPROVED', paymentId: result.paymentId }
      ).catch(err => console.error('Failed to write audit log', err));

      return { paymentId: result.paymentId, status: result.status };
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      throw new AppError(`Approval transaction failed: ${e.message}`, 'TRANSACTION_FAILED', 500);
    }
  }

  async reject(id: string, rejectionReason: string, adminId: string) {
    const pr = await prRepo.findById(id);
    if (!pr) {
      throw new AppError('Payment request not found', 'NOT_FOUND', 404);
    }

    if (pr.status !== 'PENDING') {
      throw new AppError('Payment request is not pending', 'INVALID_STATE', 400);
    }

    const updated = await prRepo.update(id, {
      status: 'REJECTED',
      rejectionReason,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedBy: adminId
    });

    return updated;
  }
}
