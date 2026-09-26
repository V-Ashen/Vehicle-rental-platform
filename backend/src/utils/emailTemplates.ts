/**
 * HTML Email Template Factory for Resend Email Dispatch
 */

export interface TemplateData {
  resetLink?: string;
  name?: string;
  amount?: string | number;
  planName?: string;
  expiryDays?: number | string;
  message?: string;
  [key: string]: any;
}

export function getEmailTemplate(type: string, data: TemplateData = {}, customMessage?: string): { subject: string; html: string } {
  const baseLayout = (title: string, bodyContent: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; font-size: 15px; line-height: 1.6; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; font-size: 14px; text-align: center; }
        .btn:hover { background-color: #1d4ed8; }
        .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Vehicle Rental Platform</h1>
        </div>
        <div class="content">
          ${bodyContent}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Vehicle Rental Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  switch (type) {
    case 'PASSWORD_RESET': {
      const link = data.resetLink || customMessage || '#';
      const subject = 'Password Reset Request';
      const html = baseLayout(subject, `
        <h2>Password Reset Request</h2>
        <p>Hello ${data.name || 'Valued User'},</p>
        <p>We received a request to reset your password. Click the button below to proceed with setting a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" class="btn">Reset Password</a>
        </div>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">Link: ${link}</p>
      `);
      return { subject, html };
    }

    case 'PAYMENT_APPROVED': {
      const subject = 'Payment Approved';
      const html = baseLayout(subject, `
        <h2>Payment Approved 🎉</h2>
        <p>Hello ${data.name || 'Valued Customer'},</p>
        <p>Your payment has been successfully processed and approved.</p>
        <div class="card">
          <p style="margin: 4px 0;"><strong>Status:</strong> Approved</p>
          ${data.amount ? `<p style="margin: 4px 0;"><strong>Amount Paid:</strong> $${data.amount}</p>` : ''}
          ${customMessage ? `<p style="margin: 4px 0;"><strong>Details:</strong> ${customMessage}</p>` : ''}
        </div>
        <p>Thank you for choosing Vehicle Rental Platform!</p>
      `);
      return { subject, html };
    }

    case 'SUBSCRIPTION_ACTIVATED': {
      const subject = 'Subscription Activated';
      const html = baseLayout(subject, `
        <h2>Subscription Activated 🚀</h2>
        <p>Hello ${data.name || 'Valued Owner'},</p>
        <p>Your subscription is now active! You have full access to our vehicle rental management platform features.</p>
        <div class="card">
          ${data.planName ? `<p style="margin: 4px 0;"><strong>Plan:</strong> ${data.planName}</p>` : ''}
          <p style="margin: 4px 0;"><strong>Status:</strong> Active</p>
          ${customMessage ? `<p style="margin: 4px 0;"><strong>Details:</strong> ${customMessage}</p>` : ''}
        </div>
        <p>Log in to your owner portal to start managing your fleet and staff.</p>
      `);
      return { subject, html };
    }

    case 'TRIAL_EXPIRING': {
      const days = data.expiryDays || 'a few';
      const subject = `Trial Expiring Soon (${days} days remaining)`;
      const html = baseLayout(subject, `
        <h2>Your Trial Period is Expiring Soon</h2>
        <p>Hello ${data.name || 'Valued Owner'},</p>
        <p>This is a friendly reminder that your trial period will end in <strong>${days} day(s)</strong>.</p>
        <p>${customMessage || 'To avoid any interruption to your service, please upgrade your subscription plan.'}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner/settings" class="btn">Upgrade Subscription</a>
        </div>
      `);
      return { subject, html };
    }

    // --- SAAS TO OWNER EMAILS ---

    case 'PROFILE_APPROVED': {
      const subject = 'Your Profile has been Approved!';
      const html = baseLayout(subject, `
        <h2>Welcome to Vehicle Rental Platform! 🎉</h2>
        <p>Hello ${data.name || 'Valued Partner'},</p>
        <p>Great news! Your account profile has been approved by our admin team.</p>
        <p>You can now log in to the portal and start setting up your rental business.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="btn">Go to Dashboard</a>
        </div>
      `);
      return { subject, html };
    }

    case 'EMAIL_VERIFICATION': {
      const link = data.verifyLink || '#';
      const subject = 'Verify your Email Address';
      const html = baseLayout(subject, `
        <h2>Verify your Email Address</h2>
        <p>Hello ${data.name || 'User'},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" class="btn">Verify Email</a>
        </div>
        <p>If you did not sign up for an account, you can ignore this email.</p>
      `);
      return { subject, html };
    }

    case 'PAYMENT_REJECTED': {
      const subject = 'Action Required: Bank Transfer Rejected';
      const html = baseLayout(subject, `
        <h2>Bank Transfer Rejected</h2>
        <p>Hello ${data.name || 'Valued Owner'},</p>
        <p>Unfortunately, the bank transfer receipt you uploaded could not be verified by our team.</p>
        <div class="card">
          <p style="color: #dc2626; font-weight: bold; margin: 4px 0;">Reason: ${customMessage || 'Invalid receipt or mismatching amount.'}</p>
        </div>
        <p>Please log in and try submitting your payment again, or choose Online Payment.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner/billing" class="btn">Go to Billing</a>
        </div>
      `);
      return { subject, html };
    }

    case 'PAYMENT_FAILED': {
      const subject = 'Action Required: Payment Failed';
      const html = baseLayout(subject, `
        <h2>Subscription Payment Failed</h2>
        <p>Hello ${data.name || 'Valued Owner'},</p>
        <p>We were unable to process your recent subscription payment.</p>
        <p>Your account services may be interrupted soon if the payment is not settled.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner/billing" class="btn">Update Payment Info</a>
        </div>
      `);
      return { subject, html };
    }

    case 'ACCOUNT_SUSPENDED': {
      const subject = 'Account Suspended';
      const html = baseLayout(subject, `
        <h2>Account Suspended</h2>
        <p>Hello ${data.name || 'Valued Owner'},</p>
        <p>Your subscription account has been temporarily suspended due to missed payments or violations of terms.</p>
        <div class="card">
          <p style="margin: 4px 0;"><strong>Details:</strong> ${customMessage || 'Subscription overdue.'}</p>
        </div>
        <p>Please contact our support team immediately to resolve this issue.</p>
      `);
      return { subject, html };
    }

    case 'FLEET_ALERT_INSURANCE': {
      const subject = 'Action Required: Vehicle Insurance Expiring';
      const html = baseLayout(subject, `
        <h2>Insurance Expiring Soon! ⚠️</h2>
        <p>Hello ${data.name || 'Fleet Manager'},</p>
        <p>The insurance policy for one of your vehicles is about to expire.</p>
        <div class="card">
          <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${data.vehicleName || 'Unknown Vehicle'}</p>
          <p style="margin: 4px 0; color: #dc2626;"><strong>Expires In:</strong> ${data.expiryDays || 5} Days</p>
        </div>
        <p>Please renew the insurance and update the documents in your dashboard.</p>
      `);
      return { subject, html };
    }

    case 'FLEET_ALERT_MAINTENANCE': {
      const subject = 'Fleet Alert: Maintenance Due';
      const html = baseLayout(subject, `
        <h2>Vehicle Maintenance Due 🔧</h2>
        <p>Hello ${data.name || 'Fleet Manager'},</p>
        <p>A vehicle in your fleet is due for scheduled maintenance.</p>
        <div class="card">
          <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${data.vehicleName || 'Unknown Vehicle'}</p>
          <p style="margin: 4px 0;"><strong>Details:</strong> ${customMessage || 'Scheduled mileage reached.'}</p>
        </div>
      `);
      return { subject, html };
    }

    // --- OWNER TO CUSTOMER EMAILS ---

    case 'BOOKING_CONFIRMATION': {
      const subject = 'Your Booking is Confirmed!';
      const html = baseLayout(subject, `
        <h2>Booking Confirmed! ✅</h2>
        <p>Hello ${data.customerName || 'Valued Customer'},</p>
        <p>Your vehicle reservation is confirmed with <strong>${data.businessName || 'Us'}</strong>.</p>
        <div class="card">
          <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${data.vehicleName}</p>
          <p style="margin: 4px 0;"><strong>Pickup:</strong> ${data.pickupDate}</p>
          <p style="margin: 4px 0;"><strong>Drop-off:</strong> ${data.dropoffDate}</p>
        </div>
        <p>We look forward to serving you!</p>
      `);
      return { subject, html };
    }

    case 'RENTAL_REMINDER': {
      const subject = 'Reminder: Rental Return Due Tomorrow';
      const html = baseLayout(subject, `
        <h2>Rental Return Reminder ⏰</h2>
        <p>Hello ${data.customerName || 'Valued Customer'},</p>
        <p>This is a friendly reminder that your rental vehicle is due back tomorrow.</p>
        <div class="card">
          <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${data.vehicleName}</p>
          <p style="margin: 4px 0; font-weight: bold;"><strong>Due Date:</strong> ${data.dropoffDate}</p>
        </div>
        <p>If you need to extend your rental, please contact us immediately.</p>
      `);
      return { subject, html };
    }

    case 'RENTAL_OVERDUE': {
      const subject = 'URGENT: Rental Vehicle Overdue';
      const html = baseLayout(subject, `
        <h2>Rental Overdue ⚠️</h2>
        <p>Hello ${data.customerName || 'Valued Customer'},</p>
        <p>Your rental vehicle is currently <strong>OVERDUE</strong> for return.</p>
        <div class="card">
          <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${data.vehicleName}</p>
          <p style="margin: 4px 0; color: #dc2626;"><strong>Was Due:</strong> ${data.dropoffDate}</p>
        </div>
        <p>Please return the vehicle immediately or contact us to avoid further late fees and penalties.</p>
      `);
      return { subject, html };
    }

    case 'FINAL_RECEIPT': {
      const subject = 'Your Final Rental Receipt';
      const html = baseLayout(subject, `
        <h2>Thank you for your business! 🧾</h2>
        <p>Hello ${data.customerName || 'Valued Customer'},</p>
        <p>Your rental is complete. Here is the final breakdown of your charges:</p>
        <div class="card">
          <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${data.vehicleName}</p>
          <p style="margin: 4px 0;"><strong>Base Rental:</strong> $${data.baseRate}</p>
          ${data.extraKmCharges ? `<p style="margin: 4px 0;"><strong>Extra KM Charges:</strong> $${data.extraKmCharges}</p>` : ''}
          ${data.lateFees ? `<p style="margin: 4px 0; color: #dc2626;"><strong>Late Fees:</strong> $${data.lateFees}</p>` : ''}
          ${data.damageFees ? `<p style="margin: 4px 0; color: #dc2626;"><strong>Damage Charges:</strong> $${data.damageFees}</p>` : ''}
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;">
          <p style="margin: 4px 0; font-size: 18px; font-weight: bold;"><strong>Total Paid:</strong> $${data.totalPaid}</p>
        </div>
        <p>We hope to see you again soon!</p>
      `);
      return { subject, html };
    }

    default: {
      const subject = customMessage ? 'Notification Alert' : 'System Notification';
      const html = baseLayout(subject, `
        <h2>System Notification</h2>
        <p>Hello ${data.name || 'User'},</p>
        <p>${customMessage || 'You have a new system notification.'}</p>
      `);
      return { subject, html };
    }
  }
}
