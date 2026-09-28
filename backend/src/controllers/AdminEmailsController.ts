import { Request, Response } from 'express';
import { getEmailTemplate } from '../utils/emailTemplates';
import { Resend } from 'resend';
import { db } from '../config/firebase';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export class AdminEmailsController {
  async getTemplates(req: Request, res: Response) {
    const types = [
      'PASSWORD_RESET',
      'PAYMENT_APPROVED',
      'SUBSCRIPTION_ACTIVATED',
      'TRIAL_EXPIRING',
      'PROFILE_APPROVED',
      'EMAIL_VERIFICATION',
      'PAYMENT_REJECTED',
      'PAYMENT_FAILED',
      'ACCOUNT_SUSPENDED',
      'FLEET_ALERT_INSURANCE',
      'FLEET_ALERT_MAINTENANCE',
      'BOOKING_CONFIRMATION',
      'RENTAL_REMINDER',
      'RENTAL_OVERDUE',
      'FINAL_RECEIPT',
    ];

    const dummyData = {
      name: 'John Doe',
      customerName: 'Jane Smith',
      businessName: 'Super Rentals Inc.',
      vehicleName: 'Toyota Prius (AB-1234)',
      pickupDate: new Date().toLocaleString(),
      dropoffDate: new Date(Date.now() + 86400000).toLocaleString(),
      amount: '150.00',
      planName: 'Pro Tier',
      expiryDays: '3',
      baseRate: '100.00',
      extraKmCharges: '20.00',
      lateFees: '10.00',
      damageFees: '20.00',
      totalPaid: '150.00'
    };

    const templates = types.map(type => {
      const template = getEmailTemplate(type, dummyData, 'This is a sample custom message.');
      return {
        type,
        subject: template.subject,
        html: template.html,
      };
    });

    res.status(200).json({ success: true, data: templates });
  }

  async testTemplate(req: Request, res: Response) {
    try {
      const { email, type } = req.body;

      if (!email || !type) {
        return res.status(400).json({ success: false, message: 'Email and type are required' });
      }

      const dummyData = {
        name: 'Test Admin',
        customerName: 'Test Customer',
        businessName: 'Admin Testing Inc.',
        vehicleName: 'Test Vehicle (TEST-123)',
        pickupDate: new Date().toLocaleString(),
        dropoffDate: new Date(Date.now() + 86400000).toLocaleString(),
        amount: '99.99',
        planName: 'Test Plan',
        expiryDays: '7',
        baseRate: '50.00',
        extraKmCharges: '10.00',
        lateFees: '5.00',
        damageFees: '0.00',
        totalPaid: '65.00'
      };

      const template = getEmailTemplate(type, dummyData, 'This is a test message triggered from the Admin panel.');

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@booking.pixzoralabs.com',
        to: email,
        subject: `[TEST] ${template.subject}`,
        html: template.html,
      });

      if (error) {
        throw new Error(error.message);
      }

      res.status(200).json({ success: true, message: 'Test email dispatched successfully', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const snapshot = await db.collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const userCache: Record<string, string> = {};

      const historyPromises = snapshot.docs.map(async doc => {
        const data = doc.data();
        let userName = data.userId; // fallback to ID

        if (data.userId === 'TENANT_ADMIN') {
          if (data.tenantId) {
            if (userCache[`TENANT_${data.tenantId}`]) {
              userName = userCache[`TENANT_${data.tenantId}`];
            } else {
              const tenantDoc = await db.collection('tenants').doc(data.tenantId).get();
              if (tenantDoc.exists) {
                userName = `${tenantDoc.data()?.businessName || 'Unknown Business'} (Admin)`;
                userCache[`TENANT_${data.tenantId}`] = userName;
              } else {
                userName = 'Tenant Admin';
              }
            }
          } else {
            userName = 'Tenant Admin';
          }
        } else if (data.userId) {
          if (userCache[data.userId]) {
            userName = userCache[data.userId];
          } else {
            // Check if customer
            if (data.userId.startsWith('CUS-')) {
              const custDoc = await db.collection('customers').doc(data.userId).get();
              if (custDoc.exists) {
                userName = custDoc.data()?.fullName || custDoc.data()?.name || data.userId;
              }
            } else {
              // Assume user
              const userDoc = await db.collection('users').doc(data.userId).get();
              if (userDoc.exists) {
                userName = userDoc.data()?.fullName || userDoc.data()?.name || data.userId;
              }
            }
            userCache[data.userId] = userName;
          }
        }

        return {
          id: doc.id,
          tenantId: data.tenantId,
          userId: data.userId,
          userName: userName,
          type: data.type,
          subject: data.subject,
          status: data.status,
          errorMessage: data.errorMessage || null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        };
      });

      const history = await Promise.all(historyPromises);

      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
