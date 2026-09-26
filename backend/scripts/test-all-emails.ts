import { Resend } from 'resend';
import { getEmailTemplate } from '../src/utils/emailTemplates';
import * as dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function runTests() {
  const targetEmail = process.argv[2] || 'vihangaasen321@gmail.com';
  console.log(`Starting email tests. Target email: ${targetEmail}`);
  console.log(`Using RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'Set' : 'Not Set'}`);

  const templatesToTest = [
    // SaaS to Owner
    {
      type: 'PROFILE_APPROVED',
      data: { name: 'John Doe' }
    },
    {
      type: 'EMAIL_VERIFICATION',
      data: { name: 'John Doe', verifyLink: 'http://localhost:3000/verify?token=123' }
    },
    {
      type: 'PAYMENT_REJECTED',
      data: { name: 'John Doe' },
      customMessage: 'The uploaded receipt was blurry and unreadable.'
    },
    {
      type: 'PAYMENT_FAILED',
      data: { name: 'John Doe' }
    },
    {
      type: 'ACCOUNT_SUSPENDED',
      data: { name: 'John Doe' },
      customMessage: 'Overdue balance of $99 for Growth Plan.'
    },
    {
      type: 'FLEET_ALERT_INSURANCE',
      data: { name: 'John Doe', vehicleName: 'Toyota Prius (CA-1234)', expiryDays: 3 }
    },
    {
      type: 'FLEET_ALERT_MAINTENANCE',
      data: { name: 'John Doe', vehicleName: 'Honda Civic (CB-5678)' },
      customMessage: 'Vehicle has reached 50,000 KM threshold.'
    },

    // Owner to Customer
    {
      type: 'BOOKING_CONFIRMATION',
      data: {
        customerName: 'Jane Smith',
        businessName: 'Cars by Asen',
        vehicleName: 'Toyota Axio',
        pickupDate: 'Sept 20, 2026',
        dropoffDate: 'Sept 25, 2026'
      }
    },
    {
      type: 'RENTAL_REMINDER',
      data: {
        customerName: 'Jane Smith',
        vehicleName: 'Toyota Axio',
        dropoffDate: 'Sept 25, 2026 (10:00 AM)'
      }
    },
    {
      type: 'RENTAL_OVERDUE',
      data: {
        customerName: 'Jane Smith',
        vehicleName: 'Toyota Axio',
        dropoffDate: 'Sept 25, 2026 (10:00 AM)'
      }
    },
    {
      type: 'FINAL_RECEIPT',
      data: {
        customerName: 'Jane Smith',
        vehicleName: 'Toyota Axio',
        baseRate: '250.00',
        extraKmCharges: '45.00',
        lateFees: '20.00',
        damageFees: null,
        totalPaid: '315.00'
      }
    }
  ];

  for (const template of templatesToTest) {
    try {
      console.log(`Sending ${template.type}...`);
      const { subject, html } = getEmailTemplate(template.type, template.data, template.customMessage);
      
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Vehicle Platform <onboarding@resend.dev>',
        to: targetEmail,
        subject: subject,
        html: html
      });
      
      if (error) {
        throw new Error(error.message);
      }
      console.log(`✅ ${template.type} sent successfully!`);
    } catch (err: any) {
      console.error(`❌ Failed to send ${template.type}: ${err.message}`);
    }
    // Wait 1 second between emails to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('All tests completed.');
}

runTests().catch(console.error).finally(() => process.exit(0));
