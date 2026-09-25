import { db } from '../config/firebase';
import { Payment } from '../types';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { AppError } from '../utils/AppError';
import { AuditLogService } from './AuditLogService';

const auditService = new AuditLogService();

export class OwnerPaymentService {
  async recordPayment(
    tenantId: string,
    userId: string,
    data: {
      customerId: string;
      rentalId?: string;
      amount: number;
      method: 'CASH' | 'CARD' | 'BANK' | 'ONLINE';
      paymentType: 'RENTAL' | 'DEPOSIT' | 'ADVANCE' | 'DAMAGE' | 'OTHER';
      notes?: string;
    }
  ) {
    const paymentId = generateId(IdPrefix.PAYMENT);
    const paymentRef = db.collection('payments').doc(paymentId);
    
    // Verify customer exists
    const customerRef = db.collection('customers').doc(data.customerId);
    const now = new Date();
    let createdPayment: any = null;

    try {
      await db.runTransaction(async (t) => {
        const customerDoc = await t.get(customerRef);
        
        if (!customerDoc.exists || customerDoc.data()?.tenantId !== tenantId) {
          throw new AppError('Customer not found', 'NOT_FOUND', 404);
        }
        
        const paymentData = {
          id: paymentId,
          tenantId,
          paymentType: data.paymentType,
          referenceId: data.rentalId || data.customerId,
          amount: data.amount,
          currency: 'LKR',
          method: data.method,
          provider: 'MANUAL',
          providerTransactionId: null,
          status: 'SUCCESS',
          paidAt: now,
          metadata: {
            customerId: data.customerId,
            rentalId: data.rentalId || null,
            notes: data.notes || null,
          },
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId
        };

        if (data.rentalId && (data.paymentType === 'RENTAL' || data.paymentType === 'ADVANCE' || data.paymentType === 'DAMAGE' || data.paymentType === 'OTHER')) {
          const rentalRef = db.collection('rentals').doc(data.rentalId);
          const rentalDoc = await t.get(rentalRef);
          
          if (rentalDoc.exists && rentalDoc.data()?.tenantId === tenantId) {
            const rental = rentalDoc.data();
            const currentBalance = rental.balanceDue ?? rental.totalAmount ?? 0;
            const newBalance = Math.max(0, currentBalance - data.amount);
            
            t.update(rentalRef, {
              balanceDue: newBalance,
              updatedAt: now,
              updatedBy: userId
            });
          }
        }

        t.set(paymentRef, paymentData);
        createdPayment = paymentData;
      });
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      throw new AppError(`Payment transaction failed: ${e.message}`, 'INTERNAL_SERVER_ERROR', 500);
    }

    await auditService.logAction(
      tenantId,
      userId,
      'CUSTOMER_PAYMENT_RECORDED',
      'BILLING',
      paymentId,
      undefined,
      createdPayment
    );

    return createdPayment;
  }

  async listPayments(tenantId: string, limit: number = 20, cursor?: string) {
    const paymentsRef = db.collection('payments');
    let q: FirebaseFirestore.Query = paymentsRef
      .where('tenantId', '==', tenantId)
      .where('provider', '==', 'MANUAL') // Only fetch manual customer payments, not SaaS subscriptions
      .orderBy('createdAt', 'desc');

    if (cursor) {
      const docRef = await paymentsRef.doc(cursor).get();
      if (docRef.exists) {
        q = q.startAfter(docRef);
      }
    }

    q = q.limit(limit);

    const snapshot = await q.get();
    
    if (snapshot.empty) {
      return { payments: [], pagination: { nextCursor: null, totalCount: 0 } };
    }

    const rawPayments: any[] = [];
    snapshot.forEach(doc => rawPayments.push(doc.data()));

    // Collect unique customerIds
    const customerIds = new Set<string>();
    rawPayments.forEach(p => {
      if (p.metadata?.customerId) customerIds.add(p.metadata.customerId);
    });

    // Fetch customers
    const customersMap = new Map<string, any>();
    const customerIdsArray = Array.from(customerIds);
    for (let i = 0; i < customerIdsArray.length; i += 10) {
      const batch = customerIdsArray.slice(i, i + 10);
      if (batch.length > 0) {
        const snap = await db.collection('customers').where('id', 'in', batch).get();
        snap.forEach(c => customersMap.set(c.id, c.data()));
      }
    }

    const enrichedPayments = rawPayments.map(p => {
      const customer = p.metadata?.customerId ? customersMap.get(p.metadata.customerId) : null;
      return {
        ...p,
        customerName: customer ? customer.fullName : 'Unknown'
      };
    });

    const nextCursor = enrichedPayments.length === limit ? enrichedPayments[enrichedPayments.length - 1].id : null;

    const countSnap = await paymentsRef
      .where('tenantId', '==', tenantId)
      .where('provider', '==', 'MANUAL')
      .count()
      .get();
      
    const totalCount = countSnap.data().count;

    return {
      payments: enrichedPayments,
      pagination: {
        nextCursor,
        totalCount
      }
    };
  }
}
