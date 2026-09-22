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
