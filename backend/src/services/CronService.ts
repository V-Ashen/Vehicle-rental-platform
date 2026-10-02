import { Resend } from 'resend';
import { db } from '../config/firebase';
import { NotificationService } from './NotificationService';
import { AppError } from '../utils/AppError';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { getEmailTemplate } from '../utils/emailTemplates';

const notificationService = new NotificationService();
const resend = new Resend(process.env.RESEND_API_KEY);

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
        let recipientEmail: string | null = data.email || null;
        let userName: string | undefined = data.userName;

        if (!recipientEmail && data.userId && data.userId !== 'TENANT_ADMIN') {
          if (data.userId.startsWith('CUS-')) {
            const customerDoc = await db.collection('customers').doc(data.userId).get();
            if (customerDoc.exists) {
              const customerData = customerDoc.data();
              recipientEmail = customerData?.email || null;
              userName = customerData?.fullName || customerData?.name;
            }
          } else {
            const userDoc = await db.collection('users').doc(data.userId).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              recipientEmail = userData?.email || null;
              userName = userData?.fullName || userData?.name;
            }
          }
        }

        if (!recipientEmail && data.tenantId) {
          const ownerQuery = await db.collection('users')
            .where('tenantId', '==', data.tenantId)
            .limit(1)
            .get();
          if (!ownerQuery.empty) {
            const userData = ownerQuery.docs[0].data();
            recipientEmail = userData.email;
            userName = userData.fullName || userData.name;
          }
        }

        if (!recipientEmail) {
          throw new Error(`User email not found for userId: ${data.userId}, tenantId: ${data.tenantId}`);
        }

        const template = getEmailTemplate(
          data.type,
          {
            name: userName,
            resetLink: data.message && data.message.startsWith('http') ? data.message : undefined,
            amount: data.amount,
            planName: data.planName,
            expiryDays: data.expiryDays,
            ...data
          },
          data.message
        );

        const emailSubject = data.subject || template.subject;
        const htmlContent = template.html;

        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@booking.pixzoralabs.com',
          to: recipientEmail,
          subject: emailSubject,
          html: htmlContent
        });

        if (error) {
          throw new Error(`Resend dispatch error: ${error.message}`);
        }

        // Mark as sent
        batch.update(doc.ref, {
          status: 'SENT',
          sentAt: new Date(),
          updatedAt: new Date(),
          updatedBy: 'SYSTEM_CRON'
        });
        successCount++;
      } catch (e: any) {
        if (e?.message?.includes('monthly email sending quota')) {
          console.error(`[Quota Reached] Failed to send notification ${doc.id}`);
        } else {
          console.error(`Failed to send notification ${doc.id}:`, e.message);
        }
        batch.update(doc.ref, {
          status: 'FAILED',
          errorMessage: e?.message || 'Unknown error',
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

    const settingsDoc = await db.collection('systemSettings').doc('notifications').get();
    const globalAlertsEnabled = settingsDoc.exists ? settingsDoc.data()?.subscriptionAlertsEnabled !== false : true;

    let remindersSent = 0;
    let expiredCount = 0;

    const batch = db.batch();

    for (const doc of activeQ.docs) {
      const sub = doc.data();
      if (!sub.trialEndAt) continue;

      const tenantDoc = await tenantsRef.doc(sub.tenantId).get();
      const tenantData = tenantDoc.exists ? tenantDoc.data() : null;
      
      // Skip suspended or rejected tenants
      if (!tenantData || tenantData.accountStatus === 'SUSPENDED' || tenantData.accountStatus === 'REJECTED') {
        continue;
      }

      const endDate = sub.trialEndAt.toDate ? sub.trialEndAt.toDate() : new Date(sub.trialEndAt);
      const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

      // Reminders
      if ((diffDays === 7 || diffDays === 3 || diffDays === 1) && sub.lastReminderDays !== diffDays) {
        const tenantEmailEnabled = tenantData.subscriptionEmailEnabled !== false;
        const sendEmail = globalAlertsEnabled && tenantEmailEnabled;

        const notifId = generateId(IdPrefix.NOTIFICATION);
        const notifRef = db.collection('notifications').doc(notifId);

        batch.set(notifRef, {
          id: notifId,
          tenantId: sub.tenantId,
          userId: 'TENANT_ADMIN',
          type: 'RENEWAL_REMINDER',
          channel: sendEmail ? 'EMAIL' : 'APP',
          subject: `Your subscription expires in ${diffDays} days!`,
          message: `Please renew your subscription to avoid service interruption.`,
          status: sendEmail ? 'QUEUED' : 'SENT',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'SYSTEM_CRON',
          updatedBy: 'SYSTEM_CRON'
        });

        batch.update(doc.ref, { lastReminderDays: diffDays });
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
          channel: globalAlertsEnabled ? 'EMAIL' : 'APP',
          subject: `Account Suspended - Subscription Expired`,
          message: `Your account has been suspended due to an expired subscription. Please renew.`,
          status: globalAlertsEnabled ? 'QUEUED' : 'SENT',
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

  async processDailyRentals() {
    const now = new Date();
    const rentalsRef = db.collection('rentals');
    const batch = db.batch();
    let overdueCount = 0;
    let upcomingCount = 0;

    // Action 1: Overdue
    const overdueQuery = await rentalsRef
      .where('status', '==', 'ON_RENT')
      .where('expectedReturnAt', '<', now)
      .get();

    const settingsDoc = await db.collection('systemSettings').doc('notifications').get();
    const rentalAndFleetAlertsEnabled = settingsDoc.exists ? settingsDoc.data()?.rentalAndFleetAlertsEnabled !== false : true;

    const tenantCache: Record<string, boolean> = {};
    const isTenantActive = async (tenantId: string) => {
      if (tenantCache[tenantId] !== undefined) return tenantCache[tenantId];
      const doc = await db.collection('tenants').doc(tenantId).get();
      const data = doc.exists ? doc.data() : null;
      tenantCache[tenantId] = data ? (data.accountStatus !== 'SUSPENDED' && data.accountStatus !== 'REJECTED') : false;
      return tenantCache[tenantId];
    };

    for (const doc of overdueQuery.docs) {
      const rental = doc.data();
      if (!(await isTenantActive(rental.tenantId))) continue;
      
      if (!rental.isOverdue) {
        batch.update(doc.ref, {
          isOverdue: true,
          updatedAt: new Date(),
          updatedBy: 'SYSTEM_CRON'
        });

        // Notify Customer
        const notifId = generateId(IdPrefix.NOTIFICATION);
        const notifRef = db.collection('notifications').doc(notifId);
        batch.set(notifRef, {
          id: notifId,
          tenantId: rental.tenantId,
          userId: rental.customerId,
          type: 'OVERDUE_ALERT',
          channel: rentalAndFleetAlertsEnabled ? 'EMAIL' : 'APP',
          subject: 'Rental Overdue Notice',
          message: `Your rental is overdue! Please return the vehicle immediately to avoid additional late charges.`,
          status: rentalAndFleetAlertsEnabled ? 'QUEUED' : 'SENT',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'SYSTEM_CRON',
          updatedBy: 'SYSTEM_CRON'
        });

        // Notify Owner
        const ownerNotifId = generateId(IdPrefix.NOTIFICATION);
        const ownerNotifRef = db.collection('notifications').doc(ownerNotifId);
        batch.set(ownerNotifRef, {
          id: ownerNotifId,
          tenantId: rental.tenantId,
          userId: 'TENANT_ADMIN',
          type: 'OVERDUE_ALERT',
          channel: rentalAndFleetAlertsEnabled ? 'EMAIL' : 'APP',
          subject: 'Vehicle Overdue Alert',
          message: `Vehicle for rental ${rental.id} is overdue by customer.`,
          status: rentalAndFleetAlertsEnabled ? 'QUEUED' : 'SENT',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'SYSTEM_CRON',
          updatedBy: 'SYSTEM_CRON'
        });
        
        overdueCount++;
      }
    }

    // Action 2: Upcoming Pickup (within 24 hours)
    const plus24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcomingQuery = await rentalsRef
      .where('status', '==', 'RESERVED')
      .where('pickupAt', '>', now)
      .where('pickupAt', '<=', plus24)
      .get();

    for (const doc of upcomingQuery.docs) {
      const rental = doc.data();
      if (!(await isTenantActive(rental.tenantId))) continue;

      if (!rental.upcomingNotified) {
        batch.update(doc.ref, {
          upcomingNotified: true,
          updatedAt: new Date(),
          updatedBy: 'SYSTEM_CRON'
        });

        const notifId = generateId(IdPrefix.NOTIFICATION);
        const notifRef = db.collection('notifications').doc(notifId);
        batch.set(notifRef, {
          id: notifId,
          tenantId: rental.tenantId,
          userId: rental.customerId,
          type: 'UPCOMING_PICKUP',
          channel: rentalAndFleetAlertsEnabled ? 'EMAIL' : 'APP',
          subject: 'Upcoming Vehicle Pickup',
          message: `Your vehicle rental is scheduled for pickup within 24 hours!`,
          status: rentalAndFleetAlertsEnabled ? 'QUEUED' : 'SENT',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'SYSTEM_CRON',
          updatedBy: 'SYSTEM_CRON'
        });

        upcomingCount++;
      }
    }

    if (overdueCount > 0 || upcomingCount > 0) {
      await batch.commit();
    }

    return { overdueCount, upcomingCount, message: 'Processed daily rentals successfully' };
  }

  async processDailyVehicles() {
    const now = new Date();
    const docsRef = db.collection('vehicleDocuments');
    const batch = db.batch();
    let remindersSent = 0;
    let expiredCount = 0;

    const activeDocs = await docsRef.where('status', '==', 'ACTIVE').get();
    const settingsDoc = await db.collection('systemSettings').doc('notifications').get();
    const rentalAndFleetAlertsEnabled = settingsDoc.exists ? settingsDoc.data()?.rentalAndFleetAlertsEnabled !== false : true;

    const tenantCache: Record<string, boolean> = {};
    const isTenantActive = async (tenantId: string) => {
      if (tenantCache[tenantId] !== undefined) return tenantCache[tenantId];
      const doc = await db.collection('tenants').doc(tenantId).get();
      const data = doc.exists ? doc.data() : null;
      tenantCache[tenantId] = data ? (data.accountStatus !== 'SUSPENDED' && data.accountStatus !== 'REJECTED') : false;
      return tenantCache[tenantId];
    };

    for (const doc of activeDocs.docs) {
      const vDoc = doc.data();
      if (!vDoc.expiryDate) continue;
      if (!(await isTenantActive(vDoc.tenantId))) continue;

      const endDate = vDoc.expiryDate.toDate ? vDoc.expiryDate.toDate() : new Date(vDoc.expiryDate);
      const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

      // Expirations
      if (diffDays <= 0) {
        batch.update(doc.ref, {
          status: 'EXPIRED',
          updatedAt: new Date(),
          updatedBy: 'SYSTEM_CRON'
        });

        const notifId = generateId(IdPrefix.NOTIFICATION);
        const notifRef = db.collection('notifications').doc(notifId);
        batch.set(notifRef, {
          id: notifId,
          tenantId: vDoc.tenantId,
          userId: 'TENANT_ADMIN',
          type: 'FLEET_ALERT_INSURANCE',
          channel: rentalAndFleetAlertsEnabled ? 'EMAIL' : 'APP',
          subject: `Vehicle Document Expired`,
          message: `The ${vDoc.documentType} document for vehicle ${vDoc.vehicleId} has expired!`,
          status: rentalAndFleetAlertsEnabled ? 'QUEUED' : 'SENT',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'SYSTEM_CRON',
          updatedBy: 'SYSTEM_CRON'
        });

        expiredCount++;
      }
      // Reminders (7, 3, 1 days)
      else if ((diffDays === 7 || diffDays === 3 || diffDays === 1) && vDoc.lastReminderDays !== diffDays) {
        batch.update(doc.ref, { lastReminderDays: diffDays });

        const notifId = generateId(IdPrefix.NOTIFICATION);
        const notifRef = db.collection('notifications').doc(notifId);
        batch.set(notifRef, {
          id: notifId,
          tenantId: vDoc.tenantId,
          userId: 'TENANT_ADMIN',
          type: 'FLEET_ALERT_INSURANCE',
          channel: rentalAndFleetAlertsEnabled ? 'EMAIL' : 'APP',
          subject: `Vehicle Document Expiring Soon`,
          message: `The ${vDoc.documentType} document for vehicle ${vDoc.vehicleId} will expire in ${diffDays} days.`,
          status: rentalAndFleetAlertsEnabled ? 'QUEUED' : 'SENT',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'SYSTEM_CRON',
          updatedBy: 'SYSTEM_CRON'
        });

        remindersSent++;
      }
    }

    if (remindersSent > 0 || expiredCount > 0) {
      await batch.commit();
    }

    return { remindersSent, expiredCount, message: 'Processed vehicle documents successfully' };
  }
}
