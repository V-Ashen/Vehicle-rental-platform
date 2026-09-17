import 'express-async-errors';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';

import adminPackageRoutes from './routes/admin.packages.routes';
import adminTenantRoutes from './routes/admin.tenants.routes';
import adminPaymentRequestRoutes from './routes/admin.payment-requests.routes';
import adminDashboardRoutes from './routes/admin.dashboard.routes';
import ownerProfileRoutes from './routes/owner.profile.routes';
import ownerUploadRoutes from './routes/owner.upload.routes';
import customerRoutes from './routes/customers.routes';
import vehicleRoutes from './routes/vehicles.routes';
import rentalRoutes from './routes/rentals.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import reportRoutes from './routes/reports.routes';
import paymentRoutes from './routes/payments.routes';
import webhookRoutes from './routes/webhooks.routes';
import cronRoutes from './routes/cron.routes';
import { helmetConfig, authRateLimiter, globalRateLimiter } from './middlewares/securityMiddleware';

const app = express();

app.use(helmetConfig); // 1. Secure HTTP Headers
app.use(cors());
app.use(express.json());

// 2. Apply Rate Limiters
app.use(globalRateLimiter);
app.use('/api/v1/auth', authRateLimiter); // Stricter limit for auth routes

// Public Webhooks (No Auth required)
app.use('/api/v1/webhooks', webhookRoutes);

// Internal Cron Jobs (Secured by secret header)
app.use('/api/v1/cron', cronRoutes);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/packages', adminPackageRoutes);
app.use('/api/v1/admin/tenants', adminTenantRoutes);
app.use('/api/v1/admin/payment-requests', adminPaymentRequestRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/owner/profile', ownerProfileRoutes);
app.use('/api/v1/owner/upload', ownerUploadRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/rentals', rentalRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

// Root path handler
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the Vehicle Rental Platform API. Server is running!' });
});

// Error handling must be the last middleware
app.use(errorHandler);

export default app;
