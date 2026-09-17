import { db } from '../config/firebase';
import { NotificationService } from './NotificationService';
import { AppError } from '../utils/AppError';
import { generateId, IdPrefix } from '../utils/idGenerator';

const notificationService = new NotificationService();

export class CronService {
  async processNotifications() {
    const batchSize = 50;
    const notificationsRef = db.collection('notifications');
    const q = notificationsRef.where('status', '==', 'QUEUED').limit(batchSize);

    const snapshot = await q.get();
    let successCount = 0;
    let failedCount = 0;

    if (snapshot.empty) {
      return { successCount, failedCount, message: 'No queued notifications' };
    }

    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      try {
        // Simulate sending via AWS SNS / Resend
        // await emailClient.send({...});
        
        // Mark as sent
        batch.update(doc.ref, { 
          status: 'SENT',
          updatedAt: new Date(),
          updatedBy: 'SYSTEM_CRON'
        });
        successCount++;
      } catch (e) {
        console.error(`Failed to send notification ${doc.id}:`, e);
        batch.update(doc.ref, { 
          status: 'FAILED',
          updatedAt: new Date(),
          updatedBy: 'SYSTEM_CRON'
        });
        failedCount++;
      }
    }

    await batch.commit();
    return { successCount, failedCount, message: `Processed ${successCount + failedCount} notifications` };
  }

  async processDailySubscriptions() {
    const now = new Date();
    
    // Calculate dates for reminders
    const plus7 = new Date(); plus7.setDate(now.getDate() + 7);
    const plus3 = new Date(); plus3.setDate(now.getDate() + 3);
    const plus1 = new Date(); plus1.setDate(now.getDate() + 1);

    const subscriptionsRef = db.collection('subscriptions');
    const tenantsRef = db.collection('tenants');
    
    // We fetch active and trial subscriptions. 
    // In Firestore without a composite index, we can just fetch all ACTIVE/TRIAL and filter in-memory for this MVP, 
    // or query by status and filter by date.
    
    const activeQ = await subscriptionsRef.where('status', 'in', ['ACTIVE', 'TRIAL']).get();
    
    let remindersSent = 0;
    let expiredCount = 0;

    const batch = db.batch();

    for (const doc of activeQ.docs) {
      const sub = doc.data();
      if (!sub.trialEndAt) continue;

      const endDate = sub.trialEndAt.toDate ? sub.trialEndAt.toDate() : new Date(sub.trialEndAt);
      const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

      // Reminders
      if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
        const notifId = generateId(IdPrefix.NOTIFICATION);
        const notifRef = db.collection('notifications').doc(notifId);
        
        batch.set(notifRef, {
          id: notifId,
          tenantId: sub.tenantId,
          userId: 'TENANT_ADMIN',
          type: 'RENEWAL_REMINDER',
          channel: 'EMAIL',
          subject: `Your subscription expires in ${diffDays} days!`,
          message: `Please renew your subscription to avoid service interruption.`,
          status: 'QUEUED',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'SYSTEM_CRON',
          updatedBy: 'SYSTEM_CRON'
        });
        remindersSent++;
      }
      
      // Expirations
      if (diffDays <= 0) {
        // Suspend the subscription
        batch.update(doc.ref, { 
          status: 'EXPIRED',
          updatedAt: new Date(),
          updatedBy: 'SYSTEM_CRON'
        });

        // Suspend the tenant
        const tenantRef = tenantsRef.doc(sub.tenantId);
        batch.update(tenantRef, {
          accountStatus: 'SUSPENDED',
          updatedAt: new Date(),
          updatedBy: 'SYSTEM_CRON'
        });

        // Queue Suspension Notification
        const notifId = generateId(IdPrefix.NOTIFICATION);
        const notifRef = db.collection('notifications').doc(notifId);
        batch.set(notifRef, {
          id: notifId,
          tenantId: sub.tenantId,
          userId: 'TENANT_ADMIN',
          type: 'ACCOUNT_SUSPENDED',
          channel: 'EMAIL',
          subject: `Account Suspended - Subscription Expired`,
          message: `Your account has been suspended due to an expired subscription. Please renew.`,
          status: 'QUEUED',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'SYSTEM_CRON',
          updatedBy: 'SYSTEM_CRON'
        });

        expiredCount++;
      }
    }

    if (remindersSent > 0 || expiredCount > 0) {
      await batch.commit();
    }

    return { remindersSent, expiredCount, message: `Processed subscriptions successfully` };
  }
}
